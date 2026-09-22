import type { LatestReading, LatestReadingRow } from './reading'
import { normalizeQuality } from './quality'

/** Maps a `v_latest_readings` row to the domain `LatestReading` shape. */
export function toLatestReading(row: LatestReadingRow): LatestReading {
  return {
    sensorId: row.sensor_id,
    deviceId: row.device_id,
    value: row.value,
    timestamp: row.timestamp,
    quality: normalizeQuality(row.quality),
    channel: row.channel,
    unit: row.unit,
    sensorLabel: row.sensor_label,
    sensorTag: row.sensor_tag,
    deviceName: row.device_name,
    rssi: row.rssi,
  }
}
