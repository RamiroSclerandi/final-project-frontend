import type { FleetReadingInput } from './fleetNode'

/** Buckets readings by `deviceId` for O(1) lookup while building fleet nodes. */
export function groupReadingsByDevice(
  readings: FleetReadingInput[],
): Record<string, FleetReadingInput[]> {
  const grouped: Record<string, FleetReadingInput[]> = {}
  for (const reading of readings) {
    const existing = grouped[reading.deviceId]
    grouped[reading.deviceId] = existing ? [...existing, reading] : [reading]
  }
  return grouped
}
