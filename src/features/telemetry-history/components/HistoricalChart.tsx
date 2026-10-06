import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { formatAxisTime } from '../../../shared/i18n/format'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { unitLabel } from '../../../shared/lib/unitLabel'
import { downsampleLTTB } from '../domain/downsample'
import type { HistoricalPoint } from '../domain/historicalPoint'

const CHART_HEIGHT = 320
const SPARSE_SERIES_THRESHOLD = 3
const Y_AXIS_WIDTH = 92
const CHART_MARGIN = { top: 16, right: 16, bottom: 0, left: 0 }
const X_TICK_COUNT = 6

/** Evenly spaced ticks: Recharts' time scale otherwise falls back to data points, leaving gaps unlabeled. */
function evenTicks(
  [from, to]: readonly [number, number],
  count: number,
): number[] {
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return []
  }
  const step = (to - from) / (count - 1)
  return Array.from({ length: count }, (_, index) => from + index * step)
}

const AXIS_TICK = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fill: 'var(--color-text-muted)',
}
const AXIS_LINE = { stroke: 'var(--color-border)' }

/** REQ-HS-4: rendering budget -- downsampling applies only at this boundary. */
export const CHART_POINT_BUDGET = 5000

type MarkerReason = 'outOfRange' | 'suspect' | 'clockUnsynced' | 'partial'

const MARKER_REASON_KEYS = {
  outOfRange: 'chart.marker.outOfRange',
  suspect: 'chart.marker.suspect',
  clockUnsynced: 'chart.marker.clockUnsynced',
  partial: 'chart.marker.partial',
} satisfies Record<MarkerReason, TranslationKey>

type TranslateFn = ReturnType<typeof useTranslation>['t']

interface ChartDatum {
  t: string
  ts: number
  value: number
  range?: [number, number]
  sampleCount?: number
  markedLabel: string | null
  markedReasons: MarkerReason[]
}

/** D-7: data enters marked, never hidden -- one label per marker present. */
function markedReasons(point: HistoricalPoint): MarkerReason[] {
  const reasons: MarkerReason[] = []
  if (point.quality && point.quality !== 'ok') {
    reasons.push(point.quality === 'out_of_range' ? 'outOfRange' : 'suspect')
  }
  if (point.tsSource === 'server') {
    reasons.push('clockUnsynced')
  }
  if (point.partial) {
    reasons.push('partial')
  }
  return reasons
}

function toChartData(points: HistoricalPoint[], t: TranslateFn): ChartDatum[] {
  return points.flatMap((point) => {
    const ts = Date.parse(point.t)
    // An unparsable timestamp has no place on a time axis; drop it rather than crash.
    if (!Number.isFinite(ts)) {
      return []
    }
    const reasons = markedReasons(point)
    return {
      t: point.t,
      ts,
      value: point.value,
      range:
        point.min !== undefined && point.max !== undefined
          ? [point.min, point.max]
          : undefined,
      sampleCount: point.sampleCount,
      markedReasons: reasons,
      markedLabel:
        reasons.length > 0
          ? t('chart.markedPoint', {
              reasons: reasons
                .map((reason) => t(MARKER_REASON_KEYS[reason]))
                .join(', '),
            })
          : null,
    }
  })
}

/**
 * Marker paint by reason (D-7): out-of-range and suspect are a filled color,
 * provisional/clock-unsynced is a dotted outline, never a fill color -- it
 * must stay visually distinct even without color perception.
 */
function markerPaint(reasons: MarkerReason[]): {
  fill: string
  strokeDasharray?: string
} {
  if (reasons.includes('outOfRange')) {
    return { fill: 'var(--color-quality-out-of-range)' }
  }
  if (reasons.includes('suspect')) {
    return { fill: 'var(--color-quality-suspect)' }
  }
  return { fill: 'none', strokeDasharray: '2 2' }
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: ChartDatum
}

/** Plain dot that keeps a sparse series visible; carries no marker semantics. */
function renderPlainDot({ cx, cy }: DotProps) {
  if (cx === undefined || cy === undefined) {
    return <g />
  }
  return <circle cx={cx} cy={cy} r={3} fill="var(--color-accent)" />
}

function renderMarkedDot(props: DotProps) {
  const { cx, cy, payload } = props
  if (!payload?.markedLabel || cx === undefined || cy === undefined) {
    return <g />
  }
  const { fill, strokeDasharray } = markerPaint(payload.markedReasons)
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      role="img"
      aria-label={payload.markedLabel}
      fill={fill}
      stroke="var(--color-text-muted)"
      strokeDasharray={strokeDasharray}
    />
  )
}

interface TooltipPayload {
  payload: { t: string; value: number; sampleCount?: number }
}

export interface HistoricalTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  unit?: string
}

/** Exported standalone so its content is unit-testable without a chart hover (D-6). */
export function HistoricalTooltip({
  active,
  payload,
  unit = '',
}: HistoricalTooltipProps) {
  const { t, formatDateTime, formatNumber } = useTranslation()
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) {
    return null
  }
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border-strong bg-surface-raised p-2 text-xs text-text md:p-3">
      <p className="font-mono tabular-nums text-text-muted">
        {formatDateTime(point.t)}
      </p>
      <p className="font-mono text-sm tabular-nums">
        {[formatNumber(point.value), unitLabel(unit)].filter(Boolean).join(' ')}
      </p>
      {point.sampleCount !== undefined && (
        <p className="text-text-muted">
          {t('chart.meanOf', { count: point.sampleCount })}
        </p>
      )}
    </div>
  )
}

export interface HistoricalChartProps {
  points: readonly HistoricalPoint[]
  isLoading: boolean
  unit?: string
  /** Epoch-ms window the X axis spans; defaults to the data's own extent. */
  domain?: readonly [number, number]
}

/**
 * Recharts line with a min/max band and marked out-of-range/partial/clock-
 * unsynced points (D-7). Renders inside `ResponsiveContainer` so it fills
 * its parent's width (REQ-SENSOR-1, REQ-MOBILE-4). `initialDimension` seeds
 * a synchronous first render wherever `ResizeObserver` is absent, which is
 * what makes this testable in jsdom (research S1). Do not add a
 * `ResizeObserver` stub to the test setup: recharts skips its measurement
 * only while the global is undefined, so a stub makes it measure a
 * layout-less document, read 0x0, and render nothing at all.
 */
export function HistoricalChart({
  points,
  isLoading,
  unit = '',
  domain,
}: HistoricalChartProps) {
  const { t, locale, formatNumber } = useTranslation()
  const rawSpanMs = domain
    ? domain[1] - domain[0]
    : points.length > 1
      ? Date.parse(points.at(-1)?.t ?? '') - Date.parse(points[0]?.t ?? '')
      : 0
  const spanMs = Number.isFinite(rawSpanMs) ? rawSpanMs : 0
  const label = unitLabel(unit)
  const chartData = useMemo(
    () =>
      toChartData(
        // Filter before downsampling so an unparsable timestamp cannot skew LTTB's selection.
        downsampleLTTB(
          points.filter((point) => Number.isFinite(Date.parse(point.t))),
          CHART_POINT_BUDGET,
        ),
        t,
      ),
    [points, t],
  )

  if (isLoading) {
    return <ChartMessage>{t('chart.loading')}</ChartMessage>
  }
  if (chartData.length === 0) {
    return <ChartMessage>{t('chart.empty')}</ChartMessage>
  }
  const isSparse = chartData.length < SPARSE_SERIES_THRESHOLD
  const xExtent: readonly [number, number] = domain ?? [
    chartData[0]?.ts ?? NaN,
    chartData.at(-1)?.ts ?? NaN,
  ]
  const xTicks = evenTicks(xExtent, X_TICK_COUNT)

  return (
    <div className="h-65 min-w-0 w-full md:h-80">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 800, height: CHART_HEIGHT }}
      >
        <ComposedChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          {/* A time scale keeps gaps at their real width; a category axis collapses them. */}
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={domain ? [...domain] : ['dataMin', 'dataMax']}
            allowDataOverflow
            ticks={xTicks.length > 0 ? xTicks : undefined}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={AXIS_LINE}
            tickFormatter={(ms: number) =>
              Number.isFinite(ms)
                ? formatAxisTime(locale, new Date(ms).toISOString(), spanMs)
                : ''
            }
            minTickGap={32}
          />
          <YAxis
            domain={['auto', 'auto']}
            width={Y_AXIS_WIDTH}
            tickCount={5}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            tickFormatter={(value: number) =>
              [formatNumber(value), label].filter(Boolean).join(' ')
            }
          />
          <Tooltip
            content={<HistoricalTooltip unit={unit} />}
            cursor={{
              stroke: 'var(--color-border-strong)',
              strokeDasharray: '3 3',
            }}
          />
          <Area
            dataKey="range"
            stroke="none"
            fill="var(--color-accent)"
            fillOpacity={0.16}
            isAnimationActive={false}
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={(props: DotProps) =>
              props.payload?.markedLabel || !isSparse
                ? renderMarkedDot(props)
                : renderPlainDot(props)
            }
            activeDot={{ r: 4, fill: 'var(--color-accent)' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Loading/empty copy held at the chart's own height so the panel never jumps. */
function ChartMessage({ children }: { children: string }) {
  return (
    <div className="flex h-65 w-full items-center justify-center text-center text-sm text-text-muted md:h-80">
      {children}
    </div>
  )
}
