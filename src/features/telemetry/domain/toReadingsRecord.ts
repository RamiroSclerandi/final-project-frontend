import type { LatestReading } from './reading'

/** Indexes a list of readings by sensorId, for O(1) cache routing updates. */
export function toReadingsRecord(
  readings: LatestReading[],
): Record<string, LatestReading> {
  return Object.fromEntries(
    readings.map((reading) => [reading.sensorId, reading]),
  )
}
