import { describe, expect, it } from 'vitest'

import { isAggregationStale } from './degradedState'

describe('isAggregationStale', () => {
  it('is not stale when there is no raw measurement at all, even with a bucket present', () => {
    expect(isAggregationStale('2026-09-15T08:00:00Z', null, 'hourly')).toBe(
      false,
    )
  })

  it('is not stale when neither a bucket nor a raw measurement exist', () => {
    expect(isAggregationStale(null, null, 'hourly')).toBe(false)
  })

  it('is stale when a raw measurement exists but there is no aggregate bucket yet', () => {
    expect(isAggregationStale(null, '2026-09-15T09:00:00Z', 'hourly')).toBe(
      true,
    )
  })

  it('compares the newest bucket to the newest raw measurement, not wall-clock time (REQ-HS-7)', () => {
    // Discriminator: bucket 08:00, newest raw 09:00 -- only 1h apart, well
    // inside the 2h hourly budget. A wall-clock comparison against a later
    // "now" (e.g. 12:00) would wrongly call this stale.
    expect(
      isAggregationStale(
        '2026-09-15T08:00:00Z',
        '2026-09-15T09:00:00Z',
        'hourly',
      ),
    ).toBe(false)
  })

  it('is stale when the newest raw measurement is more than two bucket-widths ahead of the bucket', () => {
    expect(
      isAggregationStale(
        '2026-09-15T08:00:00Z',
        '2026-09-15T11:00:00Z',
        'hourly',
      ),
    ).toBe(true)
  })

  it('is not stale when the age is negative (bucket newer than the newest raw measurement)', () => {
    expect(
      isAggregationStale(
        '2026-09-15T10:00:00Z',
        '2026-09-15T09:00:00Z',
        'hourly',
      ),
    ).toBe(false)
  })

  it('uses the daily bucket width for the daily granularity', () => {
    expect(
      isAggregationStale(
        '2026-09-14T00:00:00Z',
        '2026-09-15T12:00:00Z',
        'daily',
      ),
    ).toBe(false)
    expect(
      isAggregationStale(
        '2026-09-10T00:00:00Z',
        '2026-09-15T12:00:00Z',
        'daily',
      ),
    ).toBe(true)
  })
})
