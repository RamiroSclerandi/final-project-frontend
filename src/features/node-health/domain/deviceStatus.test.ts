import { describe, expect, it } from 'vitest'

import { toDeviceStatus } from './deviceStatus'

describe('toDeviceStatus', () => {
  it('maps a devices row to the domain shape', () => {
    expect(
      toDeviceStatus({
        id: 'device-a',
        name: 'Node A',
        status: true,
        last_seen: '2026-09-14T12:00:00Z',
      }),
    ).toEqual({
      deviceId: 'device-a',
      name: 'Node A',
      online: true,
      lastSeen: '2026-09-14T12:00:00Z',
    })
  })
})
