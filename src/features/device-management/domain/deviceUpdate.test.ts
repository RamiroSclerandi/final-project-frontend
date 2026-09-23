import { describe, expect, it } from 'vitest'

import { applyDeviceUpdate } from './deviceUpdate'
import type { Device } from './device'

const deviceA: Device = {
  id: 'device-a',
  macAddress: 'AABBCCDDEEFF',
  name: 'Node A',
  locationRef: 'Garage',
  transport: 'wifi-mqtt',
  provisioned: true,
  firmwareVersion: null,
  sensors: [],
}
const deviceB: Device = {
  id: 'device-b',
  macAddress: '112233445566',
  name: 'Node B',
  locationRef: null,
  transport: 'lorawan',
  provisioned: false,
  firmwareVersion: null,
  sensors: [],
}

describe('applyDeviceUpdate', () => {
  it('updates only the targeted device, leaving others untouched (REQ-DM-1)', () => {
    const result = applyDeviceUpdate([deviceA, deviceB], 'device-b', {
      name: 'Renamed B',
    })

    expect(result[0]).toBe(deviceA)
    expect(result[1]).toEqual({ ...deviceB, name: 'Renamed B' })
  })

  it('applies location_ref onto locationRef (REQ-DM-2)', () => {
    const result = applyDeviceUpdate([deviceA], 'device-a', {
      location_ref: 'Basement',
    })

    expect(result[0]?.locationRef).toBe('Basement')
  })

  it('merges only the fields present in the update, keeping the rest', () => {
    const result = applyDeviceUpdate([deviceA], 'device-a', {
      provisioned: false,
    })

    expect(result[0]).toEqual({ ...deviceA, provisioned: false })
  })
})
