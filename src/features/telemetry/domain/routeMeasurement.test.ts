import { describe, expect, it } from 'vitest'

import { routeMeasurement } from './routeMeasurement'

describe('routeMeasurement', () => {
  it('maps a raw measurements INSERT row to a routed update', () => {
    const routed = routeMeasurement({
      sensor_id: 'sensor-b',
      value: 21.5,
      timestamp: '2026-09-14T12:00:00Z',
      quality: 'ok',
    })

    expect(routed).toEqual({
      sensorId: 'sensor-b',
      value: 21.5,
      timestamp: '2026-09-14T12:00:00Z',
      quality: 'ok',
    })
  })

  it('normalises an unrecognised quality value to ok', () => {
    const routed = routeMeasurement({
      sensor_id: 'sensor-b',
      value: 1,
      timestamp: '2026-09-14T12:00:00Z',
      quality: 'weird',
    })

    expect(routed.quality).toBe('ok')
  })
})
