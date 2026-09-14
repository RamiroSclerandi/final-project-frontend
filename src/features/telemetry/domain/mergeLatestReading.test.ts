import { describe, expect, it } from 'vitest'

import { mergeLatestReading } from './mergeLatestReading'
import type { LatestReading } from './reading'

const sensorA: LatestReading = {
  sensorId: 'sensor-a',
  value: 10,
  timestamp: '2026-09-14T11:00:00Z',
  quality: 'ok',
  channel: 'temperature',
  unit: 'degC',
  sensorLabel: null,
  deviceName: 'Node A',
}

const sensorB: LatestReading = {
  sensorId: 'sensor-b',
  value: 20,
  timestamp: '2026-09-14T11:00:00Z',
  quality: 'ok',
  channel: 'humidity',
  unit: '%',
  sensorLabel: null,
  deviceName: 'Node B',
}

describe('mergeLatestReading', () => {
  it('updates only the routed sensor slot, leaving others untouched (REQ-RT-2)', () => {
    const readings = {
      [sensorA.sensorId]: sensorA,
      [sensorB.sensorId]: sensorB,
    }

    const result = mergeLatestReading(readings, {
      sensorId: 'sensor-b',
      value: 22.3,
      timestamp: '2026-09-14T12:00:00Z',
      quality: 'ok',
    })

    expect(result[sensorA.sensorId]).toBe(sensorA)
    expect(result[sensorB.sensorId]).toEqual({
      ...sensorB,
      value: 22.3,
      timestamp: '2026-09-14T12:00:00Z',
    })
  })

  it('leaves the cache untouched for an unrecognised sensor id (CA-5 is out of scope here)', () => {
    const readings = { [sensorA.sensorId]: sensorA }

    const result = mergeLatestReading(readings, {
      sensorId: 'unknown-sensor',
      value: 1,
      timestamp: '2026-09-14T12:00:00Z',
      quality: 'ok',
    })

    expect(result).toBe(readings)
  })
})
