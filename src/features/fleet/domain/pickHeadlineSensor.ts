import type { FleetReadingInput } from './fleetNode'

/** l1 < l2 < l3 < total < '' (blank tag) < any other tag, alphabetically (D3). */
const PHASE_ORDER = ['l1', 'l2', 'l3', 'total', ''] as const

function phaseRank(tag: string): number {
  const index = PHASE_ORDER.indexOf(tag as (typeof PHASE_ORDER)[number])
  return index === -1 ? PHASE_ORDER.length : index
}

function compareReadings(a: FleetReadingInput, b: FleetReadingInput): number {
  const channelOrder = a.channel.localeCompare(b.channel, 'en')
  if (channelOrder !== 0) {
    return channelOrder
  }
  const rankOrder = phaseRank(a.sensorTag) - phaseRank(b.sensorTag)
  if (rankOrder !== 0) {
    return rankOrder
  }
  const tagOrder = a.sensorTag.localeCompare(b.sensorTag, 'en')
  if (tagOrder !== 0) {
    return tagOrder
  }
  return a.sensorId.localeCompare(b.sensorId, 'en')
}

/**
 * Selects the headline sensor for a node's fleet-row summary (REQ-FLEET-5,
 * D3): channel ascending, then phase rank, then `sensorId` as the final
 * deterministic tie-break.
 */
export function pickHeadlineSensor(
  readings: FleetReadingInput[],
): FleetReadingInput | null {
  if (readings.length === 0) {
    return null
  }
  return [...readings].sort(compareReadings)[0] ?? null
}
