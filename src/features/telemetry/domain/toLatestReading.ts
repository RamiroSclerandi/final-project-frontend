import type { LatestReading, LatestReadingRow } from './reading'
import { normalizeQuality } from './quality'

/** Maps a `v_latest_readings` row to the domain `LatestReading` shape. */
export function toLatestReading(row: LatestReadingRow): LatestReading {
  return {
    sensorId: row.sensor_id,
    value: row.value,
    timestamp: row.timestamp,
    quality: normalizeQuality(row.quality),
    channel: row.channel,
    unit: row.unit,
    sensorLabel: row.sensor_label,
    deviceName: row.device_name,
  }
}
