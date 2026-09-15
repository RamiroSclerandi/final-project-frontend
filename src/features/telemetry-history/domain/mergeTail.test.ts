import { describe, expect, it } from 'vitest'

import type { HistoricalPoint } from './historicalPoint'
import { mergeDailyTail, mergeHourlyTail } from './mergeTail'

function rawPoint(
  t: string,
  value: number,
  quality: HistoricalPoint['quality'] = 'ok',
): HistoricalPoint {
  return { t, value, quality }
}

describe('mergeHourlyTail', () => {
  it('drops the newest aggregate bucket and recomputes it from the raw tail, marked partial (REQ-HS-3)', () => {
    const aggregatePoints: HistoricalPoint[] = [
      {
        t: '2026-09-15T10:00:00.000Z',
        value: 20,
        min: 20,
        max: 20,
        sampleCount: 1,
      },
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 21,
        min: 21,
        max: 21,
        sampleCount: 1,
      },
    ]
    const rawTail = [rawPoint('2026-09-15T11:05:00Z', 22)]

    const merged = mergeHourlyTail(aggregatePoints, rawTail)

    expect(merged).toEqual([
      aggregatePoints[0],
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 22,
        min: 22,
        max: 22,
        sampleCount: 1,
        partial: true,
      },
    ])
  })

  it('averages, mins and maxes every raw point inside the same recomputed bucket', () => {
    const aggregatePoints: HistoricalPoint[] = [
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 21,
        min: 21,
        max: 21,
        sampleCount: 1,
      },
    ]
    const rawTail = [
      rawPoint('2026-09-15T11:01:00Z', 18),
      rawPoint('2026-09-15T11:02:00Z', 24),
    ]

    const merged = mergeHourlyTail(aggregatePoints, rawTail)

    expect(merged).toEqual([
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 21,
        min: 18,
        max: 24,
        sampleCount: 2,
        partial: true,
      },
    ])
  })

  it('excludes non-ok raw points from the recomputed bucket, matching the view definition', () => {
    const aggregatePoints: HistoricalPoint[] = [
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 21,
        min: 21,
        max: 21,
        sampleCount: 1,
      },
    ]
    const rawTail = [
      rawPoint('2026-09-15T11:01:00Z', 18),
      rawPoint('2026-09-15T11:02:00Z', 999, 'out_of_range'),
    ]

    const merged = mergeHourlyTail(aggregatePoints, rawTail)

    expect(merged).toEqual([
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 18,
        min: 18,
        max: 18,
        sampleCount: 1,
        partial: true,
      },
    ])
  })

  it('produces one recomputed bucket per hour when the raw tail spans more than one hour', () => {
    const aggregatePoints: HistoricalPoint[] = [
      {
        t: '2026-09-15T10:00:00.000Z',
        value: 20,
        min: 20,
        max: 20,
        sampleCount: 1,
      },
    ]
    const rawTail = [
      rawPoint('2026-09-15T10:30:00Z', 19),
      rawPoint('2026-09-15T11:15:00Z', 22),
    ]

    const merged = mergeHourlyTail(aggregatePoints, rawTail)

    expect(merged).toEqual([
      {
        t: '2026-09-15T10:00:00.000Z',
        value: 19,
        min: 19,
        max: 19,
        sampleCount: 1,
        partial: true,
      },
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 22,
        min: 22,
        max: 22,
        sampleCount: 1,
        partial: true,
      },
    ])
  })

  it('returns just the recomputed tail when there is no aggregate data yet', () => {
    const merged = mergeHourlyTail([], [rawPoint('2026-09-15T11:05:00Z', 22)])

    expect(merged).toEqual([
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 22,
        min: 22,
        max: 22,
        sampleCount: 1,
        partial: true,
      },
    ])
  })

  it('returns an empty series when both the aggregate and the raw tail are empty', () => {
    expect(mergeHourlyTail([], [])).toEqual([])
  })
})

describe('mergeDailyTail', () => {
  it('drops the newest aggregate day and replaces it with a partial marker from the latest reading (D-3)', () => {
    const aggregatePoints: HistoricalPoint[] = [
      {
        t: '2026-09-13T00:00:00.000Z',
        value: 20,
        min: 19,
        max: 21,
        sampleCount: 288,
      },
      {
        t: '2026-09-14T00:00:00.000Z',
        value: 21,
        min: 20,
        max: 22,
        sampleCount: 288,
      },
    ]
    const latestPoint = rawPoint('2026-09-15T09:00:00Z', 23)

    const merged = mergeDailyTail(aggregatePoints, latestPoint)

    expect(merged).toEqual([
      aggregatePoints[0],
      { t: '2026-09-15T09:00:00Z', value: 23, quality: 'ok', partial: true },
    ])
  })

  it('returns only the complete days when there is no latest reading', () => {
    const aggregatePoints: HistoricalPoint[] = [
      {
        t: '2026-09-13T00:00:00.000Z',
        value: 20,
        min: 19,
        max: 21,
        sampleCount: 288,
      },
      {
        t: '2026-09-14T00:00:00.000Z',
        value: 21,
        min: 20,
        max: 22,
        sampleCount: 288,
      },
    ]

    expect(mergeDailyTail(aggregatePoints, null)).toEqual([aggregatePoints[0]])
  })

  it('carries the latest reading quality onto the partial marker', () => {
    const latestPoint = rawPoint('2026-09-15T09:00:00Z', 999, 'out_of_range')

    expect(mergeDailyTail([], latestPoint)).toEqual([
      {
        t: '2026-09-15T09:00:00Z',
        value: 999,
        quality: 'out_of_range',
        partial: true,
      },
    ])
  })
})
