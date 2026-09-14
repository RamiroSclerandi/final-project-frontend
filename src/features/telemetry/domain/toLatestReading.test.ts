import { describe, expect, it } from 'vitest'

import { toLatestReading } from './toLatestReading'

describe('toLatestReading', () => {
  it('maps a v_latest_readings row to the domain LatestReading shape', () => {
    expect(
      toLatestReading({
        sensor_id: 'sensor-a',
        value: 21.4,
        timestamp: '2026-09-14T11:00:00Z',
        quality: 'ok',
        channel: 'temperature',
        unit: 'degC',
        sensor_label: 'Greenhouse',
        device_name: 'Node A',
      }),
    ).toEqual({
      sensorId: 'sensor-a',
      value: 21.4,
      timestamp: '2026-09-14T11:00:00Z',
      quality: 'ok',
      channel: 'temperature',
      unit: 'degC',
      sensorLabel: 'Greenhouse',
      deviceName: 'Node A',
    })
  })

  it('normalises an unrecognised quality value', () => {
    expect(
      toLatestReading({
        sensor_id: 'sensor-a',
        value: 1,
        timestamp: 't',
        quality: 'weird',
        channel: 'c',
        unit: 'u',
        sensor_label: null,
        device_name: 'Node A',
      }).quality,
    ).toBe('ok')
  })
})
