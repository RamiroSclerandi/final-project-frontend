import { describe, expect, it } from 'vitest'

import { isCompleteReading } from './latestReadingsClient'

const COMPLETE_ROW = {
  sensor_id: 'sensor-a',
  device_id: 'device-1',
  value: 21.4,
  timestamp: '2026-09-14T11:00:00Z',
  quality: 'ok',
  channel: 'temperature',
  unit: 'degC',
  sensor_tag: '',
  device_name: 'Node A',
}

describe('isCompleteReading', () => {
  // `sensors.tag` is `TEXT NOT NULL DEFAULT ''` (#412): a single-channel
  // sensor's row always has `sensor_tag: ''`, never `null`. A falsy check
  // (`!row.sensor_tag`) would silently drop every one of those readings --
  // this guards the `!== null` check stays the implementation forever.
  it('accepts a row whose sensor_tag is an empty string', () => {
    expect(isCompleteReading(COMPLETE_ROW)).toBe(true)
  })

  it('rejects a row whose sensor_tag is null', () => {
    expect(isCompleteReading({ ...COMPLETE_ROW, sensor_tag: null })).toBe(false)
  })
})
