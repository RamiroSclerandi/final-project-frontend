import { describe, expect, it } from 'vitest'

import type { LatestReading } from './reading'
import { toReadingsRecord } from './toReadingsRecord'

const base: LatestReading = {
  sensorId: 'a',
  deviceId: 'device-1',
  value: 1,
  timestamp: 't',
  quality: 'ok',
  channel: 'c',
  unit: 'u',
  sensorLabel: null,
  sensorTag: 'l1',
  deviceName: 'A',
  rssi: null,
}

describe('toReadingsRecord', () => {
  it('indexes readings by sensorId', () => {
    const b: LatestReading = { ...base, sensorId: 'b', deviceName: 'B' }

    expect(toReadingsRecord([base, b])).toEqual({ a: base, b })
  })

  it('returns an empty record for an empty list', () => {
    expect(toReadingsRecord([])).toEqual({})
  })
})
