import type { Granularity } from './chooseGranularity'
import type { HistoricalPoint } from './historicalPoint'
import type { ReadingQuality } from './quality'
import { normalizeQuality } from './quality'

/** Upper bound of points a live series keeps in memory (F-10). */
export const LIVE_POINT_CAP = 50_000

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
// Daily buckets cut at the Argentine calendar day, like mv_measurements_daily
// and get_sensor_series; the zone is a fixed UTC-3 with no DST.
const ARGENTINA_OFFSET_MS = 3 * HOUR_MS

/** One measurement INSERT delivered by Realtime, mapped to the domain. */
export interface LiveReading {
  id: number
  t: string
  value: number
  quality: ReadingQuality
  tsSource?: 'server'
}

/** Structural shape of a `measurements` INSERT payload row. */
export interface LiveMeasurementRow {
  id: number
  sensor_id: string
  timestamp: string
  value: number
  quality: string
  ts_source: string
}

/**
 * A relative window slides with time (presets); a fixed one is a custom
 * date range and only takes readings inside it.
 */
export type SeriesWindow =
  | { kind: 'relative'; rangeMs: number }
  | { kind: 'fixed'; fromMs: number; toMs: number }

/** The live series plus the ids already counted in it, for deduplication. */
export interface LiveSeriesState {
  points: readonly HistoricalPoint[]
  appliedIds: ReadonlySet<number>
}

export function toLiveReading(row: LiveMeasurementRow): LiveReading {
  return {
    id: row.id,
    t: row.timestamp,
    value: row.value,
    quality: normalizeQuality(row.quality),
    ...(row.ts_source === 'server' ? { tsSource: 'server' as const } : {}),
  }
}

/** Start of the bucket holding `tMs`; `raw` has no bucket and returns `tMs`. */
export function bucketStartMs(tMs: number, granularity: Granularity): number {
  switch (granularity) {
    case 'raw':
      return tMs
    case 'minute':
      return Math.floor(tMs / MINUTE_MS) * MINUTE_MS
    case 'hourly':
      return Math.floor(tMs / HOUR_MS) * HOUR_MS
    case 'daily':
      return (
        Math.floor((tMs - ARGENTINA_OFFSET_MS) / DAY_MS) * DAY_MS +
        ARGENTINA_OFFSET_MS
      )
  }
}

/** Starts a live series from a loaded one; raw points carry their row id. */
export function seedLiveSeries(
  points: readonly HistoricalPoint[],
): LiveSeriesState {
  const appliedIds = new Set<number>()
  for (const point of points) {
    if (point.id !== undefined) {
      appliedIds.add(point.id)
    }
  }
  return { points, appliedIds }
}

function timeOf(point: HistoricalPoint): number {
  return Date.parse(point.t)
}

/** Inserts keeping `t` order; equal times go after existing points. */
function insertSorted(
  points: readonly HistoricalPoint[],
  point: HistoricalPoint,
): HistoricalPoint[] {
  const t = timeOf(point)
  let low = 0
  let high = points.length
  while (low < high) {
    const middle = (low + high) >>> 1
    const candidate = points[middle]
    if (candidate && timeOf(candidate) <= t) {
      low = middle + 1
    } else {
      high = middle
    }
  }
  return [...points.slice(0, low), point, ...points.slice(low)]
}

function withIds(
  appliedIds: ReadonlySet<number>,
  ids: Iterable<number>,
): Set<number> {
  const next = new Set(appliedIds)
  for (const id of ids) {
    next.add(id)
  }
  // Set keeps insertion order: the oldest ids go first once over the cap.
  for (const id of next) {
    if (next.size <= LIVE_POINT_CAP) {
      break
    }
    next.delete(id)
  }
  return next
}

function isProvisional(granularity: Granularity): boolean {
  return granularity === 'hourly' || granularity === 'daily'
}

function toRawLivePoint(reading: LiveReading): HistoricalPoint {
  return {
    id: reading.id,
    t: reading.t,
    value: reading.value,
    quality: reading.quality,
    ...(reading.tsSource ? { tsSource: reading.tsSource } : {}),
  }
}

/**
 * Folds one ok reading into the bucket it falls in: the running mean, min,
 * max and count, or a new bucket. A bucket without a count is the daily
 * latest-reading marker, which a newer reading replaces.
 */
function foldIntoBucket(
  points: readonly HistoricalPoint[],
  reading: LiveReading,
  granularity: Granularity,
): readonly HistoricalPoint[] {
  const start = bucketStartMs(Date.parse(reading.t), granularity)
  const index = points.findIndex(
    (point) => bucketStartMs(timeOf(point), granularity) === start,
  )
  const provisional = isProvisional(granularity) ? { partial: true } : {}
  const existing = index === -1 ? undefined : points[index]
  if (!existing) {
    return insertSorted(points, {
      t: new Date(start).toISOString(),
      value: reading.value,
      min: reading.value,
      max: reading.value,
      sampleCount: 1,
      ...provisional,
    })
  }
  if (existing.sampleCount === undefined) {
    if (Date.parse(reading.t) < timeOf(existing)) {
      return points
    }
    const marker: HistoricalPoint = {
      t: reading.t,
      value: reading.value,
      quality: reading.quality,
      partial: true,
    }
    return points.map((point, i) => (i === index ? marker : point))
  }
  const count = existing.sampleCount
  const updated: HistoricalPoint = {
    t: existing.t,
    value: (existing.value * count + reading.value) / (count + 1),
    min: Math.min(existing.min ?? existing.value, reading.value),
    max: Math.max(existing.max ?? existing.value, reading.value),
    sampleCount: count + 1,
    ...provisional,
  }
  return points.map((point, i) => (i === index ? updated : point))
}

function trimToWindow(
  points: readonly HistoricalPoint[],
  granularity: Granularity,
  window: SeriesWindow,
  nowMs: number,
): readonly HistoricalPoint[] {
  let kept = points
  if (window.kind === 'relative') {
    // A bucket is kept while it holds the window start (same as the loads).
    const cutoff = bucketStartMs(nowMs - window.rangeMs, granularity)
    const firstKept = points.findIndex((point) => timeOf(point) >= cutoff)
    kept = firstKept === -1 ? [] : points.slice(firstKept)
  }
  return kept.length > LIVE_POINT_CAP ? kept.slice(-LIVE_POINT_CAP) : kept
}

/**
 * F-10: applies one live reading. Duplicates (by `measurements.id`) and
 * readings outside a fixed window leave the state untouched; raw series take
 * the reading as a point in timestamp order (late buffered readings land in
 * the middle), bucketed series fold ok readings into their bucket.
 */
export function applyReading(
  state: LiveSeriesState,
  reading: LiveReading,
  granularity: Granularity,
  window: SeriesWindow,
  nowMs: number,
): LiveSeriesState {
  if (state.appliedIds.has(reading.id)) {
    return state
  }
  const t = Date.parse(reading.t)
  if (window.kind === 'fixed' && (t < window.fromMs || t > window.toMs)) {
    return state
  }
  const appliedIds = withIds(state.appliedIds, [reading.id])
  let points: readonly HistoricalPoint[] = state.points
  if (granularity === 'raw') {
    points = insertSorted(points, toRawLivePoint(reading))
  } else if (reading.quality === 'ok') {
    points = foldIntoBucket(points, reading, granularity)
  }
  return {
    points: trimToWindow(points, granularity, window, nowMs),
    appliedIds,
  }
}

/** Groups raw points into buckets over `quality = 'ok'` rows (D-3 rule). */
function bucketRawPoints(
  rawPoints: readonly HistoricalPoint[],
  granularity: Granularity,
): HistoricalPoint[] {
  const buckets = new Map<number, number[]>()
  for (const point of rawPoints) {
    if ((point.quality ?? 'ok') !== 'ok') {
      continue
    }
    const start = bucketStartMs(timeOf(point), granularity)
    const values = buckets.get(start) ?? []
    values.push(point.value)
    buckets.set(start, values)
  }
  const provisional = isProvisional(granularity) ? { partial: true } : {}
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, values]) => ({
      t: new Date(start).toISOString(),
      value: values.reduce((sum, value) => sum + value, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sampleCount: values.length,
      ...provisional,
    }))
}

/**
 * F-10 reconciliation: folds raw rows fetched from `fromMs` (after a
 * reconnect, or to learn the ids behind the newest bucket) into the series.
 * Raw series gain the rows they miss; bucketed series have every bucket from
 * the one holding `fromMs` recomputed from the rows. Every row id becomes
 * applied, so its live event is not counted again.
 */
export function resyncFrom(
  state: LiveSeriesState,
  fromMs: number,
  rawPoints: readonly HistoricalPoint[],
  granularity: Granularity,
): LiveSeriesState {
  const ids = rawPoints.flatMap((point) =>
    point.id === undefined ? [] : [point.id],
  )
  const appliedIds = withIds(state.appliedIds, ids)
  if (granularity === 'raw') {
    let points: readonly HistoricalPoint[] = state.points
    for (const point of rawPoints) {
      if (point.id === undefined || !state.appliedIds.has(point.id)) {
        points = insertSorted(points, point)
      }
    }
    return { points, appliedIds }
  }
  const start = bucketStartMs(fromMs, granularity)
  const kept = state.points.filter(
    (point) => bucketStartMs(timeOf(point), granularity) < start,
  )
  const recomputed = bucketRawPoints(
    rawPoints.filter((point) => timeOf(point) >= start),
    granularity,
  )
  return { points: [...kept, ...recomputed], appliedIds }
}
