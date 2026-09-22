import { describe, expect, it } from 'vitest'

import { groupReadingsByDevice } from './groupReadingsByDevice'
import type { FleetReadingInput } from './fleetNode'

function reading(overrides: Partial<FleetReadingInput>): FleetReadingInput {
  return {
    sensorId: 'sensor-1',
    deviceId: 'device-1',
    channel: 'voltage',
    unit: 'V',
    value: 220,
    quality: 'ok',
    timestamp: '2026-09-22T10:00:00Z',
    sensorTag: 'l1',
    ...overrides,
  }
}

describe('groupReadingsByDevice', () => {
  it('buckets readings under their deviceId, preserving order', () => {
    const a1 = reading({ sensorId: 'a1', deviceId: 'device-a' })
    const a2 = reading({
      sensorId: 'a2',
      deviceId: 'device-a',
      channel: 'current',
    })
    const b1 = reading({ sensorId: 'b1', deviceId: 'device-b' })

    expect(groupReadingsByDevice([a1, a2, b1])).toEqual({
      'device-a': [a1, a2],
      'device-b': [b1],
    })
  })

  it('returns an empty record for no readings', () => {
    expect(groupReadingsByDevice([])).toEqual({})
  })
})
