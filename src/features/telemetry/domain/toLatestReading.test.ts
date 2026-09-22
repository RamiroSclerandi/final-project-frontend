import { describe, expect, it } from 'vitest'

import { toLatestReading } from './toLatestReading'

describe('toLatestReading', () => {
  it('maps a v_latest_readings row to the domain LatestReading shape', () => {
    expect(
      toLatestReading({
        sensor_id: 'sensor-a',
        device_id: 'device-1',
        value: 21.4,
        timestamp: '2026-09-14T11:00:00Z',
        quality: 'ok',
        channel: 'temperature',
        unit: 'degC',
        sensor_label: 'Greenhouse',
        sensor_tag: 'l1',
        device_name: 'Node A',
        rssi: -62,
      }),
    ).toEqual({
      sensorId: 'sensor-a',
      deviceId: 'device-1',
      value: 21.4,
      timestamp: '2026-09-14T11:00:00Z',
      quality: 'ok',
      channel: 'temperature',
      unit: 'degC',
      sensorLabel: 'Greenhouse',
      sensorTag: 'l1',
      deviceName: 'Node A',
      rssi: -62,
    })
  })

  it('maps a null rssi through unchanged (D12: no reading yet, never a guess)', () => {
    expect(
      toLatestReading({
        sensor_id: 'sensor-a',
        device_id: 'device-1',
        value: 1,
        timestamp: 't',
        quality: 'ok',
        channel: 'c',
        unit: 'u',
        sensor_label: null,
        sensor_tag: '',
        device_name: 'Node A',
        rssi: null,
      }).rssi,
    ).toBeNull()
  })

  it('normalises an unrecognised quality value', () => {
    expect(
      toLatestReading({
        sensor_id: 'sensor-a',
        device_id: 'device-1',
        value: 1,
        timestamp: 't',
        quality: 'weird',
        channel: 'c',
        unit: 'u',
        sensor_label: null,
        sensor_tag: '',
        device_name: 'Node A',
        rssi: null,
      }).quality,
    ).toBe('ok')
  })
})
