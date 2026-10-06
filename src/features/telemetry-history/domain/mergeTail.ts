import type { HistoricalPoint } from './historicalPoint'

const HOUR_MS = 60 * 60 * 1000

function bucketStart(t: string, bucketMs: number): number {
  return Math.floor(new Date(t).getTime() / bucketMs) * bucketMs
}

/**
 * Same grouping and filter as `mv_measurements_hourly` (avg/min/max/count
 * over `quality = 'ok'` rows, grouped by `date_trunc`), so the view and this
 * client-side recompute cannot diverge unnoticed (D-3). Takes already-mapped
 * raw points (`quality` normalised by `toRawPoint`).
 */
function bucketRawPoints(
  rawPoints: HistoricalPoint[],
  bucketMs: number,
): HistoricalPoint[] {
  const buckets = new Map<number, number[]>()
  for (const point of rawPoints) {
    if ((point.quality ?? 'ok') !== 'ok') {
      continue
    }
    const start = bucketStart(point.t, bucketMs)
    const values = buckets.get(start) ?? []
    values.push(point.value)
    buckets.set(start, values)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, values]) => ({
      t: new Date(start).toISOString(),
      value: values.reduce((sum, value) => sum + value, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sampleCount: values.length,
    }))
}

/** Hourly buckets recomputed from raw rows; every one is flagged `partial` (D-3). */
function bucketRawByHour(rawPoints: HistoricalPoint[]): HistoricalPoint[] {
  return bucketRawPoints(rawPoints, HOUR_MS).map((bucket) => ({
    ...bucket,
    partial: true,
  }))
}

/**
 * REQ-HS-3, D-3: the newest MV bucket may be partial because the refresh can
 * land mid-bucket, so it is dropped and recomputed from the raw tail instead.
 * The boundary is `max(bucket)` in the data, never a refresh-margin constant.
 */
export function mergeHourlyTail(
  aggregatePoints: HistoricalPoint[],
  rawTailPoints: HistoricalPoint[],
): HistoricalPoint[] {
  return [...aggregatePoints.slice(0, -1), ...bucketRawByHour(rawTailPoints)]
}

/**
 * D-3: a full daily raw recompute is ~17k rows for one point, the wrong
 * price for the freshest point on a 90-day-plus chart. The newest day is a
 * single partial marker built from the latest reading instead.
 */
export function mergeDailyTail(
  aggregatePoints: HistoricalPoint[],
  latestPoint: HistoricalPoint | null,
): HistoricalPoint[] {
  const complete = aggregatePoints.slice(0, -1)
  if (!latestPoint) {
    return complete
  }
  return [...complete, { ...latestPoint, partial: true }]
}
