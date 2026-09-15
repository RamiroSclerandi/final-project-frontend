import { describe, expect, it } from 'vitest'

import { toAggregatePoint, toRawPoint } from './historicalPoint'

describe('toRawPoint', () => {
  it('maps a raw measurements row to a point carrying quality', () => {
    expect(
      toRawPoint({
        timestamp: '2026-09-01T00:00:00Z',
        value: 21.5,
        quality: 'ok',
        ts_source: 'device',
      }),
    ).toEqual({ t: '2026-09-01T00:00:00Z', value: 21.5, quality: 'ok' })
  })

  it('normalises an unrecognised quality to ok', () => {
    expect(
      toRawPoint({
        timestamp: '2026-09-01T00:00:00Z',
        value: 21.5,
        quality: 'garbage',
        ts_source: 'device',
      }),
    ).toEqual({ t: '2026-09-01T00:00:00Z', value: 21.5, quality: 'ok' })
  })

  it('marks a point whose clock was unsynced (ts_source = server), D-7', () => {
    expect(
      toRawPoint({
        timestamp: '2026-09-01T00:00:00Z',
        value: 21.5,
        quality: 'ok',
        ts_source: 'server',
      }),
    ).toEqual({
      t: '2026-09-01T00:00:00Z',
      value: 21.5,
      quality: 'ok',
      tsSource: 'server',
    })
  })
})

describe('toAggregatePoint', () => {
  it('maps a bucket row to a point carrying min/max/sampleCount and no quality', () => {
    expect(
      toAggregatePoint({
        bucket: '2026-09-01T00:00:00Z',
        avg_value: 20,
        min_value: 18,
        max_value: 22,
        sample_count: 12,
      }),
    ).toEqual({
      t: '2026-09-01T00:00:00Z',
      value: 20,
      min: 18,
      max: 22,
      sampleCount: 12,
    })
  })
})
