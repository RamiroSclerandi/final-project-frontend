import { describe, expect, it } from 'vitest'

import { pickNodeRssi } from './pickNodeRssi'
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

describe('pickNodeRssi', () => {
  it('picks the rssi of the newest row among rows with a non-null rssi (D12)', () => {
    const older = reading({ timestamp: '2026-09-22T10:00:00Z', rssi: -90 })
    const newestNonNull = reading({
      timestamp: '2026-09-22T10:05:00Z',
      rssi: -70,
    })
    const newestButNull = reading({
      timestamp: '2026-09-22T10:10:00Z',
      rssi: null,
    })

    expect(pickNodeRssi([newestNonNull, newestButNull, older])).toBe(-70)
  })

  it('returns null when every reading has a null rssi', () => {
    expect(
      pickNodeRssi([reading({ rssi: null }), reading({ rssi: null })]),
    ).toBeNull()
  })

  it('returns null for an empty readings list', () => {
    expect(pickNodeRssi([])).toBeNull()
  })
})
