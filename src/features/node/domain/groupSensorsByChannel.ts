import type { NodeReadingInput, SensorChannelGroup } from './nodeReading'

/** l1 < l2 < l3 < total < '' (blank tag) < any other tag, alphabetically. */
const PHASE_ORDER = ['l1', 'l2', 'l3', 'total'] as const

function phaseRank(tag: string): number {
  const index = PHASE_ORDER.indexOf(tag as (typeof PHASE_ORDER)[number])
  if (index !== -1) {
    return index
  }
  return tag === '' ? PHASE_ORDER.length : PHASE_ORDER.length + 1
}

function comparePhases(a: NodeReadingInput, b: NodeReadingInput): number {
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

function groupByChannel(
  readings: NodeReadingInput[],
): Map<string, NodeReadingInput[]> {
  const byChannel = new Map<string, NodeReadingInput[]>()
  for (const reading of readings) {
    const bucket = byChannel.get(reading.channel)
    if (bucket) {
      bucket.push(reading)
    } else {
      byChannel.set(reading.channel, [reading])
    }
  }
  return byChannel
}

/**
 * Groups a device's latest readings by `channel` (magnitude, #412) and
 * orders each group's sensors as phase columns L1/L2/L3/Total, an empty tag
 * next, then any other tag alphabetically (REQ-NODE-2, REQ-NODE-3).
 */
export function groupSensorsByChannel(
  readings: NodeReadingInput[],
): SensorChannelGroup[] {
  return [...groupByChannel(readings).entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .map(([channel, channelReadings]) => {
      const sorted = [...channelReadings].sort(comparePhases)
      return {
        channel,
        unit: sorted[0]?.unit ?? '',
        phases: sorted.map((reading) => ({
          tag: reading.sensorTag,
          sensorId: reading.sensorId,
          label: reading.sensorLabel,
          value: reading.value,
          quality: reading.quality,
          timestamp: reading.timestamp,
        })),
      }
    })
}
