import { describe, expect, it } from 'vitest'

import { toDeviceConfigSummary } from './deviceConfig'

describe('toDeviceConfigSummary', () => {
  it('maps a device row with a requested config', () => {
    const result = toDeviceConfigSummary({
      id: 'device-1',
      name: 'Kitchen node',
      device_configs: {
        sampling_interval_ms: 60000,
        requested_at: '2026-09-15T12:00:00Z',
      },
    })

    expect(result).toEqual({
      deviceId: 'device-1',
      deviceName: 'Kitchen node',
      config: {
        samplingIntervalMs: 60000,
        requestedAt: '2026-09-15T12:00:00Z',
      },
    })
  })

  it('maps a device row with no config yet to a null config', () => {
    const result = toDeviceConfigSummary({
      id: 'device-2',
      name: 'Garage node',
      device_configs: null,
    })

    expect(result.config).toBeNull()
  })
})
