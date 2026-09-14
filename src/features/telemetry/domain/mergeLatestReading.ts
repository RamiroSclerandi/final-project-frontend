import type { LatestReading } from './reading'
import type { RoutedMeasurement } from './routeMeasurement'

/**
 * Updates the cached reading for the routed sensor only (REQ-RT-2); an
 * unrecognised sensor id is left untouched -- surfacing it is CA-5, out of
 * scope for this slice.
 */
export function mergeLatestReading(
  readings: Record<string, LatestReading>,
  update: RoutedMeasurement,
): Record<string, LatestReading> {
  const previous = readings[update.sensorId]
  if (!previous) {
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
