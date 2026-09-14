import type { MeasurementInsertRow } from './reading'
import { normalizeQuality, type ReadingQuality } from './quality'

export interface RoutedMeasurement {
  sensorId: string
  value: number
  timestamp: string
  quality: ReadingQuality
}

/**
 * Pure client-side routing (REQ-RT-2): the channel carries no server-side
 * sensor_id filter, so this shapes a raw INSERT row into the update its
 * sensor's cache slot needs.
 */
export function routeMeasurement(row: MeasurementInsertRow): RoutedMeasurement {
  return {
    sensorId: row.sensor_id,
    value: row.value,
    timestamp: row.timestamp,
    quality: normalizeQuality(row.quality),
  }
}
