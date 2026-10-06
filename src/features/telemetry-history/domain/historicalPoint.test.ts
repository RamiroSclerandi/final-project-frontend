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

  it('keeps the window min/max/count of a raw row aggregated on the device', () => {
    expect(
      toRawPoint({
        timestamp: '2026-09-01T00:00:00Z',
        value: 21.5,
        quality: 'ok',
        ts_source: 'device',
        value_min: 20.9,
        value_max: 22.1,
        sample_count: 6,
      }),
    ).toEqual({
      t: '2026-09-01T00:00:00Z',
      value: 21.5,
      quality: 'ok',
      min: 20.9,
      max: 22.1,
      sampleCount: 6,
    })
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

  it('keeps the measurements id of a raw row so live readings can be deduplicated (F-10)', () => {
    expect(
      toRawPoint({
        id: 42,
        timestamp: '2026-09-15T11:00:00Z',
        value: 21,
        quality: 'ok',
        ts_source: 'device',
      }),
    ).toEqual({ id: 42, t: '2026-09-15T11:00:00Z', value: 21, quality: 'ok' })
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
