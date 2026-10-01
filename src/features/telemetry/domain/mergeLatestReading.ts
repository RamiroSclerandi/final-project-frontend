import type { LatestReading } from './reading'
import type { RoutedMeasurement } from './routeMeasurement'

/**
 * Updates the cached reading for the routed sensor only (REQ-RT-2). Unknown
 * sensors and updates older than the cached reading (records replayed from
 * the device buffer, audit X-5) leave the cache untouched.
 */
export function mergeLatestReading(
  readings: Record<string, LatestReading>,
  update: RoutedMeasurement,
): Record<string, LatestReading> {
  const previous = readings[update.sensorId]
  if (!previous) {
    return readings
  }
  if (Date.parse(update.timestamp) < Date.parse(previous.timestamp)) {
    return readings
  }
  return {
    ...readings,
    [update.sensorId]: {
      ...previous,
      value: update.value,
      timestamp: update.timestamp,
      quality: update.quality,
    },
  }
}
