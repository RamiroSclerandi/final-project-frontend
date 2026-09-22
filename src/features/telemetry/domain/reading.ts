import type { ReadingQuality } from './quality'

/**
 * The per-sensor latest-value shape rendered on the dashboard. `deviceId`,
 * `sensorTag`, and `rssi` are additive fields (ui-redesign ADR D1, ratified
 * decision #419): the view already sends them, the fleet/node screens need
 * them, and `rssi` stays nullable since a device may have no signal sample
 * yet (D12 fallback -- never guessed).
 */
export interface LatestReading {
  sensorId: string
  deviceId: string
  value: number
  timestamp: string
  quality: ReadingQuality
  channel: string
  unit: string
  sensorLabel: string | null
  sensorTag: string
  deviceName: string
  rssi: number | null
}

/**
 * Structural shape of a `v_latest_readings` row. Declared here instead of
 * imported from `lib/database.types.ts` so domain keeps zero imports outside
 * `shared/lib` (D-1) -- same pattern as auth's `SupabaseUserLike`.
 */
export interface LatestReadingRow {
  sensor_id: string
  device_id: string
  value: number
  timestamp: string
  quality: string
  channel: string
  unit: string
  sensor_label: string | null
  sensor_tag: string
  device_name: string
  rssi: number | null
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
