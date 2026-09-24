import { describe, expect, it } from 'vitest'

import { toDevice } from './device'

describe('toDevice', () => {
  it('maps a devices row with nested sensors to the domain shape', () => {
    const result = toDevice({
      id: 'device-1',
      mac_address: 'AABBCCDDEEFF',
      name: 'Kitchen node',
      location_ref: 'Kitchen',
      transport: 'wifi-mqtt',
      provisioned: true,
      firmware_version: '1.2.0',
      owner_id: 'user-1',
      sensors: [
        {
          id: 'sensor-1',
          label: 'Fridge temp',
          pin_connection: 'GPIO4',
          source: 'DHT22',
          tag: '',
        },
      ],
    })

    expect(result).toEqual({
      id: 'device-1',
      macAddress: 'AABBCCDDEEFF',
      name: 'Kitchen node',
      locationRef: 'Kitchen',
      transport: 'wifi-mqtt',
      provisioned: true,
      firmwareVersion: '1.2.0',
      ownerId: 'user-1',
      sensors: [
        {
          id: 'sensor-1',
          label: 'Fridge temp',
          pinConnection: 'GPIO4',
          source: 'DHT22',
          tag: '',
        },
      ],
    })
  })

  it('maps a device with no sensors yet to an empty list', () => {
    const result = toDevice({
      id: 'device-2',
      mac_address: 'AABBCCDDEE11',
      name: 'Unnamed node',
      location_ref: null,
      transport: 'lorawan',
      provisioned: false,
      firmware_version: null,
      owner_id: null,
      sensors: [],
    })

    expect(result.sensors).toEqual([])
    expect(result.locationRef).toBeNull()
  })

  // REQ-ADMIN-1 (ui-redesign PR-9): the Unassigned tab filters on this field.
  it('maps a null owner_id to ownerId, for a device no user has claimed', () => {
    const result = toDevice({
      id: 'device-4',
      mac_address: 'AABBCCDDEE33',
      name: 'Spare sensor node',
      location_ref: null,
      transport: 'wifi-mqtt',
      provisioned: false,
      firmware_version: null,
      owner_id: null,
      sensors: [],
    })

    expect(result.ownerId).toBeNull()
  })

  it('maps a null firmware_version to firmwareVersion (unprovisioned device, D12-style fallback)', () => {
    const result = toDevice({
      id: 'device-3',
      mac_address: 'AABBCCDDEE22',
      name: 'Unflashed node',
      location_ref: null,
      transport: 'wifi-mqtt',
      provisioned: false,
      firmware_version: null,
      owner_id: null,
      sensors: [],
    })

    expect(result.firmwareVersion).toBeNull()
  })
})
