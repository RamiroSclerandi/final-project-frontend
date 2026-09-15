import { describe, expect, it } from 'vitest'

import { chooseGranularity } from './chooseGranularity'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const NINETY_DAYS_MS = 90 * DAY_MS

describe('chooseGranularity', () => {
  it('returns raw under 24h (REQ-HS-1, 23h example)', () => {
    expect(chooseGranularity(23 * HOUR_MS)).toBe('raw')
  })

  it('returns hourly at 25h (REQ-HS-1 example)', () => {
    expect(chooseGranularity(25 * HOUR_MS)).toBe('hourly')
  })

  it('returns hourly at 89 days (REQ-HS-1 example)', () => {
    expect(chooseGranularity(89 * DAY_MS)).toBe('hourly')
  })

  it('returns daily at 91 days (REQ-HS-1 example)', () => {
    expect(chooseGranularity(91 * DAY_MS)).toBe('daily')
  })

  it('resolves the raw/hourly boundary exactly at 24h', () => {
    expect(chooseGranularity(DAY_MS - 1)).toBe('raw')
    expect(chooseGranularity(DAY_MS)).toBe('hourly')
  })

  it('resolves the hourly/daily boundary exactly at 90 days', () => {
    expect(chooseGranularity(NINETY_DAYS_MS - 1)).toBe('hourly')
    expect(chooseGranularity(NINETY_DAYS_MS)).toBe('daily')
  })
})
