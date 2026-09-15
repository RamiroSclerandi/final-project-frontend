import { Area, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts'

import type { HistoricalPoint } from '../domain/historicalPoint'

const CHART_WIDTH = 800
const CHART_HEIGHT = 320

interface ChartDatum {
  t: string
  value: number
  range?: [number, number]
  sampleCount?: number
  markedLabel: string | null
}

/** D-7: data enters marked, never hidden -- one label per marker present. */
function markedLabel(point: HistoricalPoint): string | null {
  const reasons: string[] = []
  if (point.quality && point.quality !== 'ok') {
    reasons.push(point.quality === 'out_of_range' ? 'out of range' : 'suspect')
  }
  if (point.tsSource === 'server') {
    reasons.push('clock unsynced')
  }
  if (point.partial) {
    reasons.push('partial')
  }
  return reasons.length > 0 ? `marked data point (${reasons.join(', ')})` : null
}

function toChartData(points: HistoricalPoint[]): ChartDatum[] {
  return points.map((point) => ({
    t: point.t,
    value: point.value,
    range:
      point.min !== undefined && point.max !== undefined
        ? [point.min, point.max]
        : undefined,
    sampleCount: point.sampleCount,
    markedLabel: markedLabel(point),
  }))
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
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      role="img"
      aria-label={payload.markedLabel}
      className="fill-amber-400 stroke-slate-950"
    />
  )
}

interface TooltipPayload {
  payload: { t: string; value: number; sampleCount?: number }
}

export interface HistoricalTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

/** Exported standalone so its content is unit-testable without a chart hover (D-6). */
export function HistoricalTooltip({ active, payload }: HistoricalTooltipProps) {
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) {
    return null
  }
  return (
    <div className="rounded border border-slate-700 bg-slate-900 p-2 text-xs text-slate-100">
      <p>{point.t}</p>
      <p>{point.value}</p>
      {point.sampleCount !== undefined && (
        <p>mean of {point.sampleCount} samples</p>
      )}
    </div>
  )
}

export interface HistoricalChartProps {
  points: HistoricalPoint[]
  isLoading: boolean
}

/**
 * Recharts line with a min/max band and marked out-of-range/partial/clock-
 * unsynced points (D-7). Fixed pixel size rather than `ResponsiveContainer`
 * so it mounts synchronously in both the browser and jsdom tests.
 */
export function HistoricalChart({ points, isLoading }: HistoricalChartProps) {
  if (isLoading) {
    return <p className="text-slate-400">Loading chart…</p>
  }
  if (points.length === 0) {
    return <p className="text-slate-400">No data for this range.</p>
  }

  return (
    <ComposedChart
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      data={toChartData(points)}
    >
      <XAxis dataKey="t" tick={false} />
      <YAxis />
      <Tooltip content={<HistoricalTooltip />} />
      <Area
        dataKey="range"
        stroke="none"
        fill="#334155"
        fillOpacity={0.5}
        isAnimationActive={false}
      />
      <Line
        dataKey="value"
        stroke="#34d399"
        dot={renderMarkedDot}
        isAnimationActive={false}
      />
    </ComposedChart>
  )
}
