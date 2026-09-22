import type { FleetReadingInput } from './fleetNode'

/** A node carries a data-quality alert when any of its latest readings failed quality (REQ-FLEET-1/2). */
export function hasQualityAlert(readings: FleetReadingInput[]): boolean {
  return readings.some((reading) => reading.quality !== 'ok')
}
