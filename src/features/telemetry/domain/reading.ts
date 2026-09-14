import type { ReadingQuality } from './quality'

/** The per-sensor latest-value shape rendered on the dashboard. */
export interface LatestReading {
  sensorId: string
  value: number
  timestamp: string
  quality: ReadingQuality
  channel: string
  unit: string
  sensorLabel: string | null
  deviceName: string
}

/**
 * Structural shape of a `v_latest_readings` row. Declared here instead of
 * imported from `lib/database.types.ts` so domain keeps zero imports outside
 * `shared/lib` (D-1) -- same pattern as auth's `SupabaseUserLike`.
 */
export interface LatestReadingRow {
  sensor_id: string
  value: number
  timestamp: string
  quality: string
  channel: string
  unit: string
  sensor_label: string | null
  device_name: string
}

/**
 * Structural shape of a `measurements` INSERT row as delivered by the
 * unfiltered Realtime channel (D-2) -- carries none of the joined
 * sensor/device metadata that `v_latest_readings` adds.
 */
export interface MeasurementInsertRow {
  sensor_id: string
  value: number
  timestamp: string
  quality: string
}
