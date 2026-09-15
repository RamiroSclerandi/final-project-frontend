import { describe, expect, it } from 'vitest'

import { isAggregationStale } from './degradedState'

describe('isAggregationStale', () => {
  it('is stale when there is no aggregate bucket at all', () => {
    expect(
      isAggregationStale(null, new Date('2026-09-15T12:00:00Z'), 'hourly'),
    ).toBe(true)
  })

  it('is not stale when the newest hourly bucket is within two bucket-widths of now', () => {
    expect(
      isAggregationStale(
        '2026-09-15T11:00:00Z',
        new Date('2026-09-15T12:30:00Z'),
        'hourly',
      ),
    ).toBe(false)
  })

  it('is stale when the newest hourly bucket is more than two bucket-widths behind now', () => {
    expect(
      isAggregationStale(
        '2026-09-15T08:00:00Z',
        new Date('2026-09-15T12:00:00Z'),
        'hourly',
      ),
    ).toBe(true)
  })

  it('uses the daily bucket width for the daily granularity', () => {
    expect(
      isAggregationStale(
        '2026-09-14T00:00:00Z',
        new Date('2026-09-15T12:00:00Z'),
        'daily',
      ),
    ).toBe(false)
    expect(
      isAggregationStale(
        '2026-09-10T00:00:00Z',
        new Date('2026-09-15T12:00:00Z'),
        'daily',
      ),
    ).toBe(true)
  })
})
