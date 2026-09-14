import { describe, expect, it } from 'vitest'

import { applyDeviceStatusUpdate } from './applyDeviceStatusUpdate'
import type { DeviceStatus } from './deviceStatus'

const deviceA: DeviceStatus = {
  deviceId: 'device-a',
  name: 'Node A',
  online: true,
  lastSeen: null,
}
const deviceB: DeviceStatus = {
  deviceId: 'device-b',
  name: 'Node B',
  online: true,
  lastSeen: null,
}

describe('applyDeviceStatusUpdate', () => {
  it('updates only the targeted device, leaving others untouched (REQ-NH-1)', () => {
    const statuses = {
      [deviceA.deviceId]: deviceA,
      [deviceB.deviceId]: deviceB,
    }

    const result = applyDeviceStatusUpdate(statuses, {
      id: 'device-b',
      name: 'Node B',
      status: false,
      last_seen: '2026-09-14T12:00:00Z',
    })

    expect(result[deviceA.deviceId]).toBe(deviceA)
    expect(result[deviceB.deviceId]).toEqual({
      deviceId: 'device-b',
      name: 'Node B',
      online: false,
      lastSeen: '2026-09-14T12:00:00Z',
    })
  })

  it('adds a device not yet in the cache', () => {
    const result = applyDeviceStatusUpdate(
      {},
      { id: 'device-c', name: 'Node C', status: false, last_seen: null },
    )

    expect(result['device-c']).toEqual({
      deviceId: 'device-c',
      name: 'Node C',
      online: false,
      lastSeen: null,
    })
  })
})
