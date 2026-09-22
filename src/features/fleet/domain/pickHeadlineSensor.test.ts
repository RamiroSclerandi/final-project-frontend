import { describe, expect, it } from 'vitest'

import { pickHeadlineSensor } from './pickHeadlineSensor'
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

describe('pickHeadlineSensor', () => {
  it('orders by channel ascending, then phase rank (D3)', () => {
    const voltageL2 = reading({
      sensorId: 'v-l2',
      channel: 'voltage',
      sensorTag: 'l2',
    })
    const voltageTotal = reading({
      sensorId: 'v-total',
      channel: 'voltage',
      sensorTag: 'total',
    })
    const currentL1 = reading({
      sensorId: 'c-l1',
      channel: 'current',
      sensorTag: 'l1',
    })

    expect(
      pickHeadlineSensor([voltageL2, voltageTotal, currentL1])?.sensorId,
    ).toBe(currentL1.sensorId)
  })

  it('tie-breaks by phase rank within the same channel (l1 before l2)', () => {
    const l2 = reading({
      sensorId: 'v-l2',
      channel: 'voltage',
      sensorTag: 'l2',
    })
    const l1 = reading({
      sensorId: 'v-l1',
      channel: 'voltage',
      sensorTag: 'l1',
    })

    expect(pickHeadlineSensor([l2, l1])?.sensorId).toBe('v-l1')
  })

  it('tie-breaks by sensorId when channel and tag are identical', () => {
    const higher = reading({
      sensorId: 'sensor-2',
      channel: 'voltage',
      sensorTag: 'l1',
    })
    const lower = reading({
      sensorId: 'sensor-1',
      channel: 'voltage',
      sensorTag: 'l1',
    })

    expect(pickHeadlineSensor([higher, lower])?.sensorId).toBe('sensor-1')
  })

  it('returns null for a device with no readings', () => {
    expect(pickHeadlineSensor([])).toBeNull()
  })
})
