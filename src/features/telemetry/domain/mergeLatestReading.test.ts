import { describe, expect, it } from 'vitest'

import { mergeLatestReading } from './mergeLatestReading'
import type { LatestReading } from './reading'

const sensorA: LatestReading = {
  sensorId: 'sensor-a',
  deviceId: 'device-1',
  value: 10,
  timestamp: '2026-09-14T11:00:00Z',
  quality: 'ok',
  channel: 'temperature',
  unit: 'degC',
  sensorLabel: null,
  sensorTag: 'l1',
  deviceName: 'Node A',
  rssi: -60,
}

const sensorB: LatestReading = {
  sensorId: 'sensor-b',
  deviceId: 'device-2',
  value: 20,
  timestamp: '2026-09-14T11:00:00Z',
  quality: 'ok',
  channel: 'humidity',
  unit: '%',
  sensorLabel: null,
  sensorTag: '',
  deviceName: 'Node B',
  rssi: null,
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

  it('carries deviceId, sensorTag, and rssi through a realtime merge (D1 additive fields)', () => {
    const readings = { [sensorA.sensorId]: sensorA }

    const result = mergeLatestReading(readings, {
      sensorId: 'sensor-a',
      value: 11.5,
      timestamp: '2026-09-14T12:00:00Z',
      quality: 'suspect',
    })

    expect(result[sensorA.sensorId]).toEqual({
      ...sensorA,
      value: 11.5,
      timestamp: '2026-09-14T12:00:00Z',
      quality: 'suspect',
    })
    expect(result[sensorA.sensorId]?.deviceId).toBe('device-1')
    expect(result[sensorA.sensorId]?.sensorTag).toBe('l1')
    expect(result[sensorA.sensorId]?.rssi).toBe(-60)
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
