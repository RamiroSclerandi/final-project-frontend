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
}

/** Structural shape of a selected raw `measurements` row. */
export interface RawMeasurementRow {
  timestamp: string
  value: number
  quality: string
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
