import { describe, expect, it } from 'vitest'

import { hasQualityAlert } from './hasQualityAlert'
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

describe('hasQualityAlert', () => {
  it('returns false when every reading has ok quality', () => {
    expect(hasQualityAlert([reading({}), reading({ sensorId: 's2' })])).toBe(
      false,
    )
  })

  it('returns true when at least one reading is not ok', () => {
    expect(
      hasQualityAlert([reading({}), reading({ quality: 'suspect' })]),
    ).toBe(true)
  })

  it('returns false for a device with no readings yet', () => {
    expect(hasQualityAlert([])).toBe(false)
  })
})
