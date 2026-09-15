import type { ReadingQuality } from './quality'
import { normalizeQuality } from './quality'

/**
 * One shape for a series point regardless of source (D-3): raw points carry
 * `quality`, aggregate points carry `min`/`max`/`sampleCount`.
 */
export interface HistoricalPoint {
  t: string
  value: number
  min?: number
  max?: number
  sampleCount?: number
  quality?: ReadingQuality
  /** D-7: set only when the row's clock was unsynced -- lower timestamp trust. */
  tsSource?: 'server'
  /** D-3: the newest bucket, recomputed from raw or a latest-reading marker. */
  partial?: boolean
}

/** Structural shape of a selected raw `measurements` row. */
export interface RawMeasurementRow {
  timestamp: string
  value: number
  quality: string
  ts_source: string
}

/** Structural shape of a selected `mv_measurements_hourly`/`_daily` row. */
export interface AggregateBucketRow {
  bucket: string
  avg_value: number
  min_value: number
  max_value: number
  sample_count: number
}

export function toRawPoint(row: RawMeasurementRow): HistoricalPoint {
  return {
    t: row.timestamp,
    value: row.value,
    quality: normalizeQuality(row.quality),
    ...(row.ts_source === 'server' ? { tsSource: 'server' as const } : {}),
  }
}

export function toAggregatePoint(row: AggregateBucketRow): HistoricalPoint {
  return {
    t: row.bucket,
    value: row.avg_value,
    min: row.min_value,
    max: row.max_value,
    sampleCount: row.sample_count,
  }
}
