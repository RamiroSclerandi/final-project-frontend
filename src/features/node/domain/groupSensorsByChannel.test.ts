import { describe, expect, it } from 'vitest'

import { groupSensorsByChannel } from './groupSensorsByChannel'
import type { NodeReadingInput } from './nodeReading'

function reading(overrides: Partial<NodeReadingInput>): NodeReadingInput {
  return {
    sensorId: 'sensor-1',
    channel: 'voltage',
    unit: 'V',
    value: 220,
    quality: 'ok',
    timestamp: '2026-09-22T10:00:00Z',
    sensorTag: 'l1',
    sensorLabel: null,
    rssi: null,
    ...overrides,
  }
}

const MAGNITUDES = [
  'active_energy',
  'apparent_power',
  'current',
  'frequency',
  'humidity',
  'power',
  'power_factor',
  'pressure',
  'reactive_power',
  'temperature',
  'voltage',
]

describe('groupSensorsByChannel', () => {
  it('groups 11 magnitudes x l1/l2/l3/total into 11 groups of 4 ordered phase columns (REQ-NODE-2)', () => {
    const readings = MAGNITUDES.flatMap((channel) =>
      (['l1', 'l2', 'l3', 'total'] as const).map((tag, index) =>
        reading({
          sensorId: `${channel}-${tag}`,
          channel,
          sensorTag: tag,
          value: index,
        }),
      ),
    )

    const groups = groupSensorsByChannel(readings)

    expect(groups).toHaveLength(11)
    expect(groups[0]?.phases.map((p) => p.tag)).toEqual([
      'l1',
      'l2',
      'l3',
      'total',
    ])
  })

  it('sorts groups by channel name ascending', () => {
    const readings = [
      reading({ sensorId: 'v-l1', channel: 'voltage', sensorTag: 'l1' }),
      reading({ sensorId: 'c-l1', channel: 'current', sensorTag: 'l1' }),
    ]

    const groups = groupSensorsByChannel(readings)

    expect(groups.map((g) => g.channel)).toEqual(['current', 'voltage'])
  })

  it('collapses a single empty-tag sensor into one unlabeled column (REQ-NODE-3)', () => {
    const readings = [
      reading({ sensorId: 'humidity-1', channel: 'humidity', sensorTag: '' }),
    ]

    const groups = groupSensorsByChannel(readings)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.phases).toHaveLength(1)
    expect(groups[0]?.phases[0]?.tag).toBe('')
  })

  it('orders an empty tag after l1/l2/l3/total within the same channel', () => {
    const readings = [
      reading({ sensorId: 'v-total', channel: 'voltage', sensorTag: 'total' }),
      reading({ sensorId: 'v-blank', channel: 'voltage', sensorTag: '' }),
      reading({ sensorId: 'v-l1', channel: 'voltage', sensorTag: 'l1' }),
    ]

    const groups = groupSensorsByChannel(readings)

    expect(groups[0]?.phases.map((p) => p.tag)).toEqual(['l1', 'total', ''])
  })

  it('returns an empty array for no readings', () => {
    expect(groupSensorsByChannel([])).toEqual([])
  })

  it('maps sensorLabel/value/quality/timestamp/sensorId onto each phase', () => {
    const readings = [
      reading({
        sensorId: 'humidity-1',
        channel: 'humidity',
        sensorTag: '',
        sensorLabel: 'Greenhouse humidity',
        value: 55.5,
        quality: 'ok',
        timestamp: '2026-09-22T10:05:00Z',
        unit: '%',
      }),
    ]

    const groups = groupSensorsByChannel(readings)

    expect(groups[0]).toEqual({
      channel: 'humidity',
      unit: '%',
      phases: [
        {
          tag: '',
          sensorId: 'humidity-1',
          label: 'Greenhouse humidity',
          value: 55.5,
          quality: 'ok',
          timestamp: '2026-09-22T10:05:00Z',
        },
      ],
    })
  })
})
