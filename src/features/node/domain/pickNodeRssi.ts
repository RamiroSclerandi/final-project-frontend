import type { NodeReadingInput } from './nodeReading'

/**
 * Picks the node's signal strength: the `rssi` of the max-timestamp row
 * among the device's readings with a non-null `rssi`, `null` when none
 * (D12, refined). Sensors on one device share a radio, so the newest
 * non-null sample is the node's signal -- never averaged or guessed.
 */
export function pickNodeRssi(readings: NodeReadingInput[]): number | null {
  let newest: NodeReadingInput | null = null
  for (const reading of readings) {
    if (reading.rssi === null) {
      continue
    }
    if (
      !newest ||
      Date.parse(reading.timestamp) > Date.parse(newest.timestamp)
    ) {
      newest = reading
    }
  }
  return newest?.rssi ?? null
}
