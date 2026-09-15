import { describe, expect, it } from 'vitest'

import type { Device } from './device'
import { applySensorUpdate } from './sensorUpdate'

const device: Device = {
  id: 'device-a',
  macAddress: 'AABBCCDDEEFF',
  name: 'Node A',
  locationRef: null,
  transport: 'wifi-mqtt',
  provisioned: true,
  sensors: [
    {
      id: 'sensor-1',
      label: 'Old label',
      pinConnection: null,
      source: 'DHT22',
      tag: '',
    },
    {
      id: 'sensor-2',
      label: null,
      pinConnection: null,
      source: 'BMP280',
      tag: '',
    },
  ],
}

describe('applySensorUpdate', () => {
  it('updates only the targeted sensor, leaving sibling sensors untouched (REQ-DM-3)', () => {
    const result = applySensorUpdate([device], 'sensor-1', {
      label: 'New label',
    })

    expect(result[0]?.sensors[0]).toEqual({
      ...device.sensors[0],
      label: 'New label',
    })
    expect(result[0]?.sensors[1]).toBe(device.sensors[1])
  })

  it('applies pin_connection onto pinConnection', () => {
    const result = applySensorUpdate([device], 'sensor-2', {
      pin_connection: 'GPIO5',
    })

    expect(result[0]?.sensors[1]?.pinConnection).toBe('GPIO5')
  })

  it('leaves devices with no matching sensor untouched', () => {
    const result = applySensorUpdate([device], 'sensor-unknown', {
      label: 'Nope',
    })

    expect(result[0]).toEqual(device)
  })
})
