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
      sensors: [],
    })

    expect(result.sensors).toEqual([])
    expect(result.locationRef).toBeNull()
  })
})
