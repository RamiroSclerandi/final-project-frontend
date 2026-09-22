import { describe, expect, it } from 'vitest'

import { buildFleetNodes } from './buildFleetNodes'
import type {
  FleetDeviceInput,
  FleetReadingInput,
  FleetStatusInput,
} from './fleetNode'

const deviceA: FleetDeviceInput = {
  id: 'device-a',
  name: 'Greenhouse A',
  locationRef: 'Row 1',
  transport: 'wifi-mqtt',
}
const deviceB: FleetDeviceInput = {
  id: 'device-b',
  name: 'Greenhouse B',
  locationRef: null,
  transport: 'lorawan',
}

const readingA: FleetReadingInput = {
  sensorId: 'sensor-a1',
  deviceId: 'device-a',
  channel: 'voltage',
  unit: 'V',
  value: 220,
  quality: 'out_of_range',
  timestamp: '2026-09-22T10:00:00Z',
  sensorTag: 'l1',
}

describe('buildFleetNodes', () => {
  it('joins devices, statuses, and readings into fleet nodes', () => {
    const statusesById: Record<string, FleetStatusInput> = {
      'device-a': { online: true, lastSeen: '2026-09-22T10:05:00Z' },
    }
    const readingsByDevice: Record<string, FleetReadingInput[]> = {
      'device-a': [readingA],
    }

    const nodes = buildFleetNodes(
      [deviceA, deviceB],
      statusesById,
      readingsByDevice,
    )

    expect(nodes).toEqual([
      {
        id: 'device-a',
        name: 'Greenhouse A',
        location: 'Row 1',
        transport: 'wifi-mqtt',
        status: 'online',
        lastSeen: '2026-09-22T10:05:00Z',
        hasQualityAlert: true,
        headline: {
          sensorId: 'sensor-a1',
          channel: 'voltage',
          unit: 'V',
          value: 220,
        },
      },
      {
        id: 'device-b',
        name: 'Greenhouse B',
        location: null,
        transport: 'lorawan',
        status: 'unknown',
        lastSeen: null,
        hasQualityAlert: false,
        headline: null,
      },
    ])
  })

  it('returns an empty list for an empty fleet', () => {
    expect(buildFleetNodes([], {}, {})).toEqual([])
  })
})
