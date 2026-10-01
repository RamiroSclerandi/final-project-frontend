import { useMemo } from 'react'
import {
  Area,
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
  return points.map((point) => {
    const reasons = markedReasons(point)
    return {
      t: point.t,
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

function renderMarkedDot(props: {
  cx?: number
  cy?: number
  payload?: ChartDatum
}) {
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
    <div className="rounded border border-border bg-surface p-2 text-xs text-text">
      <p>{formatDateTime(point.t)}</p>
      <p>
        {[formatNumber(point.value), unitLabel(unit)].filter(Boolean).join(' ')}
      </p>
      {point.sampleCount !== undefined && (
        <p>{t('chart.meanOf', { count: point.sampleCount })}</p>
      )}
    </div>
  )
}

export interface HistoricalChartProps {
  points: HistoricalPoint[]
  isLoading: boolean
  unit?: string
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
}: HistoricalChartProps) {
  const { t, locale, formatNumber } = useTranslation()
  const spanMs =
    points.length > 1
      ? Date.parse(points.at(-1)?.t ?? '') - Date.parse(points[0]?.t ?? '')
      : 0
  const label = unitLabel(unit)
  const chartData = useMemo(
    () => toChartData(downsampleLTTB(points, CHART_POINT_BUDGET), t),
    [points, t],
  )

  if (isLoading) {
    return <p className="text-text-muted">{t('chart.loading')}</p>
  }
  if (points.length === 0) {
    return <p className="text-text-muted">{t('chart.empty')}</p>
  }

  return (
    <div className="min-w-0 w-full">
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
        initialDimension={{ width: 800, height: CHART_HEIGHT }}
      >
        <ComposedChart data={chartData}>
          <XAxis
            dataKey="t"
            tickFormatter={(iso: string) => formatAxisTime(locale, iso, spanMs)}
            minTickGap={32}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(value: number) =>
              [formatNumber(value), label].filter(Boolean).join(' ')
            }
          />
          <Tooltip content={<HistoricalTooltip unit={unit} />} />
          <Area
            dataKey="range"
            stroke="none"
            fill="var(--color-surface-raised)"
            fillOpacity={0.5}
            isAnimationActive={false}
          />
          <Line
            dataKey="value"
            stroke="var(--color-accent)"
            dot={renderMarkedDot}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
