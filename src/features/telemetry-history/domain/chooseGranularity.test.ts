import { describe, expect, it } from 'vitest'

import { chooseGranularity } from './chooseGranularity'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

describe('chooseGranularity', () => {
  it.each([
    ['5 min', 5 * MINUTE_MS, 'raw'],
    ['15 min', 15 * MINUTE_MS, 'raw'],
    ['30 min', 30 * MINUTE_MS, 'raw'],
    ['1 hour', HOUR_MS, 'raw'],
    ['6 hours', 6 * HOUR_MS, 'minute'],
    ['24 hours', DAY_MS, 'minute'],
    ['15 days', 15 * DAY_MS, 'hourly'],
    ['30 days', 30 * DAY_MS, 'hourly'],
    ['90 days', 90 * DAY_MS, 'hourly'],
    ['180 days', 180 * DAY_MS, 'daily'],
    ['365 days', 365 * DAY_MS, 'daily'],
  ])(
    'resolves the %s preset to the target-table bucket',
    (_preset, rangeMs, bucket) => {
      expect(chooseGranularity(rangeMs)).toBe(bucket)
    },
  )

  it('resolves the raw/minute boundary just past 1 hour', () => {
    expect(chooseGranularity(HOUR_MS)).toBe('raw')
    expect(chooseGranularity(HOUR_MS + 1)).toBe('minute')
  })

  it('resolves the minute/hourly boundary just past 24 hours', () => {
    expect(chooseGranularity(DAY_MS)).toBe('minute')
    expect(chooseGranularity(DAY_MS + 1)).toBe('hourly')
  })

  it('resolves the hourly/daily boundary just past 90 days', () => {
    expect(chooseGranularity(90 * DAY_MS)).toBe('hourly')
    expect(chooseGranularity(90 * DAY_MS + 1)).toBe('daily')
  })

  it('applies the same rule to a custom range between presets', () => {
    expect(chooseGranularity(3 * HOUR_MS)).toBe('minute')
    expect(chooseGranularity(7 * DAY_MS)).toBe('hourly')
    expect(chooseGranularity(120 * DAY_MS)).toBe('daily')
  })
})
