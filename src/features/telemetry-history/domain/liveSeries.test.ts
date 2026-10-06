import { describe, expect, it } from 'vitest'

import type { HistoricalPoint } from './historicalPoint'
import type { LiveReading, SeriesWindow } from './liveSeries'
import {
  LIVE_POINT_CAP,
  applyReading,
  bucketStartMs,
  resyncFrom,
  seedLiveSeries,
  toLiveReading,
} from './liveSeries'

const NOW = Date.parse('2026-09-15T12:00:00Z')
const HOUR_MS = 60 * 60 * 1000
const LAST_HOUR: SeriesWindow = { kind: 'relative', rangeMs: HOUR_MS }

function reading(
  id: number,
  t: string,
  value: number,
  quality: LiveReading['quality'] = 'ok',
): LiveReading {
  return { id, t, value, quality }
}

function rawPoint(id: number, t: string, value: number): HistoricalPoint {
  return { id, t, value, quality: 'ok' }
}

describe('applyReading on a raw series', () => {
  const base = seedLiveSeries([
    rawPoint(1, '2026-09-15T11:58:00.000Z', 20),
    rawPoint(2, '2026-09-15T11:59:00.000Z', 21),
  ])

  it('appends a new reading at the end', () => {
    const next = applyReading(
      base,
      reading(3, '2026-09-15T11:59:30.000Z', 22),
      'raw',
      LAST_HOUR,
      NOW,
    )

    expect(next.points.map((point) => point.value)).toEqual([20, 21, 22])
  })

  it('inserts a late reading in timestamp order, not at the end', () => {
    const next = applyReading(
      base,
      reading(3, '2026-09-15T11:58:30.000Z', 25),
      'raw',
      LAST_HOUR,
      NOW,
    )

    expect(next.points.map((point) => point.t)).toEqual([
      '2026-09-15T11:58:00.000Z',
      '2026-09-15T11:58:30.000Z',
      '2026-09-15T11:59:00.000Z',
    ])
  })

  it('ignores a reading whose id is already in the series', () => {
    const next = applyReading(
      base,
      reading(2, '2026-09-15T11:59:00.000Z', 21),
      'raw',
      LAST_HOUR,
      NOW,
    )

    expect(next).toBe(base)
  })

  it('keeps a non-ok reading as a marked point, like the initial load', () => {
    const next = applyReading(
      base,
      reading(3, '2026-09-15T11:59:30.000Z', 99, 'out_of_range'),
      'raw',
      LAST_HOUR,
      NOW,
    )

    expect(next.points.at(-1)).toEqual({
      id: 3,
      t: '2026-09-15T11:59:30.000Z',
      value: 99,
      quality: 'out_of_range',
    })
  })

  it('drops points older than the sliding window as time advances', () => {
    const next = applyReading(
      base,
      reading(3, '2026-09-15T12:58:30.000Z', 22),
      'raw',
      LAST_HOUR,
      NOW + HOUR_MS - 90_000,
    )

    expect(next.points.map((point) => point.id)).toEqual([2, 3])
  })

  it('leaves a fixed range that ended in the past unchanged', () => {
    const fixed: SeriesWindow = {
      kind: 'fixed',
      fromMs: NOW - 2 * HOUR_MS,
      toMs: NOW - HOUR_MS,
    }

    const next = applyReading(
      base,
      reading(3, '2026-09-15T11:59:30.000Z', 22),
      'raw',
      fixed,
      NOW,
    )

    expect(next).toBe(base)
  })

  it(`never holds more than ${LIVE_POINT_CAP} points`, () => {
    const start = NOW - HOUR_MS / 2
    const full = seedLiveSeries(
      Array.from({ length: LIVE_POINT_CAP }, (_, index) =>
        rawPoint(index, new Date(start + index).toISOString(), index),
      ),
    )

    const next = applyReading(
      full,
      reading(LIVE_POINT_CAP, new Date(NOW).toISOString(), 1),
      'raw',
      LAST_HOUR,
      NOW,
    )

    expect(next.points).toHaveLength(LIVE_POINT_CAP)
    expect(next.points[0]?.id).toBe(1)
  })
})

describe('applyReading on a bucketed series', () => {
  const minuteBase = seedLiveSeries([
    {
      t: '2026-09-15T11:58:00.000Z',
      value: 20,
      min: 18,
      max: 22,
      sampleCount: 2,
    },
    {
      t: '2026-09-15T11:59:00.000Z',
      value: 10,
      min: 10,
      max: 10,
      sampleCount: 1,
    },
  ])
  const sixHours: SeriesWindow = { kind: 'relative', rangeMs: 6 * HOUR_MS }

  it('updates the bucket in progress with exact mean, min, max and count', () => {
    const next = applyReading(
      minuteBase,
      reading(7, '2026-09-15T11:59:40.000Z', 16),
      'minute',
      sixHours,
      NOW,
    )

    expect(next.points.at(-1)).toEqual({
      t: '2026-09-15T11:59:00.000Z',
      value: 13,
      min: 10,
      max: 16,
      sampleCount: 2,
    })
  })

  it('opens a new bucket for a reading past the newest one', () => {
    const next = applyReading(
      minuteBase,
      reading(7, '2026-09-15T12:00:05.000Z', 30),
      'minute',
      sixHours,
      NOW,
    )

    expect(next.points.at(-1)).toEqual({
      t: '2026-09-15T12:00:00.000Z',
      value: 30,
      min: 30,
      max: 30,
      sampleCount: 1,
    })
  })

  it('counts a redelivered reading only once', () => {
    const once = applyReading(
      minuteBase,
      reading(7, '2026-09-15T11:59:40.000Z', 16),
      'minute',
      sixHours,
      NOW,
    )

    const twice = applyReading(
      once,
      reading(7, '2026-09-15T11:59:40.000Z', 16),
      'minute',
      sixHours,
      NOW,
    )

    expect(twice).toBe(once)
  })

  it('keeps non-ok readings out of the aggregate, like the matviews', () => {
    const next = applyReading(
      minuteBase,
      reading(7, '2026-09-15T11:59:40.000Z', 999, 'suspect'),
      'minute',
      sixHours,
      NOW,
    )

    expect(next.points).toEqual(minuteBase.points)
  })

  it('flags hourly buckets it updates as provisional', () => {
    const hourly = seedLiveSeries([
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 20,
        min: 20,
        max: 20,
        sampleCount: 1,
      },
    ])

    const next = applyReading(
      hourly,
      reading(7, '2026-09-15T11:30:00.000Z', 22),
      'hourly',
      { kind: 'relative', rangeMs: 15 * 24 * HOUR_MS },
      NOW,
    )

    expect(next.points.at(-1)).toEqual({
      t: '2026-09-15T11:00:00.000Z',
      value: 21,
      min: 20,
      max: 22,
      sampleCount: 2,
      partial: true,
    })
  })

  it('replaces a latest-reading marker instead of averaging into it', () => {
    const daily = seedLiveSeries([
      {
        t: '2026-09-15T09:00:00.000Z',
        value: 23,
        quality: 'ok',
        partial: true,
      },
    ])

    const next = applyReading(
      daily,
      reading(7, '2026-09-15T11:00:00.000Z', 25),
      'daily',
      { kind: 'relative', rangeMs: 180 * 24 * HOUR_MS },
      NOW,
    )

    expect(next.points).toEqual([
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 25,
        quality: 'ok',
        partial: true,
      },
    ])
  })

  it('drops whole buckets that slid out of the window, keeping the one it starts in', () => {
    const next = applyReading(
      minuteBase,
      reading(7, '2026-09-15T17:58:30.000Z', 30),
      'minute',
      sixHours,
      Date.parse('2026-09-15T17:58:30.000Z'),
    )

    expect(next.points.map((point) => point.t)).toEqual([
      '2026-09-15T11:58:00.000Z',
      '2026-09-15T11:59:00.000Z',
      '2026-09-15T17:58:00.000Z',
    ])

    const later = applyReading(
      next,
      reading(8, '2026-09-15T17:59:10.000Z', 31),
      'minute',
      sixHours,
      Date.parse('2026-09-15T17:59:10.000Z'),
    )

    expect(later.points.map((point) => point.t)).toEqual([
      '2026-09-15T11:59:00.000Z',
      '2026-09-15T17:58:00.000Z',
      '2026-09-15T17:59:00.000Z',
    ])
  })
})

describe('bucketStartMs', () => {
  it('cuts days at the Argentine calendar day, like mv_measurements_daily', () => {
    expect(
      new Date(
        bucketStartMs(Date.parse('2026-09-15T02:00:00Z'), 'daily'),
      ).toISOString(),
    ).toBe('2026-09-14T03:00:00.000Z')
    expect(
      new Date(
        bucketStartMs(Date.parse('2026-09-15T03:00:00Z'), 'daily'),
      ).toISOString(),
    ).toBe('2026-09-15T03:00:00.000Z')
  })

  it('aligns minutes and hours to the epoch', () => {
    const t = Date.parse('2026-09-15T11:59:40.123Z')
    expect(new Date(bucketStartMs(t, 'minute')).toISOString()).toBe(
      '2026-09-15T11:59:00.000Z',
    )
    expect(new Date(bucketStartMs(t, 'hourly')).toISOString()).toBe(
      '2026-09-15T11:00:00.000Z',
    )
  })
})

describe('resyncFrom', () => {
  it('merges missing raw rows into a raw series without duplicating known ones', () => {
    const base = seedLiveSeries([rawPoint(1, '2026-09-15T11:58:00.000Z', 20)])

    const next = resyncFrom(
      base,
      Date.parse('2026-09-15T11:58:00.000Z'),
      [
        rawPoint(1, '2026-09-15T11:58:00.000Z', 20),
        rawPoint(2, '2026-09-15T11:58:30.000Z', 21),
      ],
      'raw',
    )

    expect(next.points.map((point) => point.id)).toEqual([1, 2])
  })

  it('recomputes buckets from raw rows from the resync start onwards', () => {
    const base = seedLiveSeries([
      {
        t: '2026-09-15T11:57:00.000Z',
        value: 5,
        min: 5,
        max: 5,
        sampleCount: 1,
      },
      {
        t: '2026-09-15T11:58:00.000Z',
        value: 20,
        min: 20,
        max: 20,
        sampleCount: 1,
      },
    ])

    const next = resyncFrom(
      base,
      Date.parse('2026-09-15T11:58:00.000Z'),
      [
        rawPoint(1, '2026-09-15T11:58:00.000Z', 20),
        rawPoint(2, '2026-09-15T11:58:30.000Z', 22),
        { ...rawPoint(3, '2026-09-15T11:58:40.000Z', 99), quality: 'suspect' },
        rawPoint(4, '2026-09-15T11:59:10.000Z', 30),
      ],
      'minute',
    )

    expect(next.points).toEqual([
      {
        t: '2026-09-15T11:57:00.000Z',
        value: 5,
        min: 5,
        max: 5,
        sampleCount: 1,
      },
      {
        t: '2026-09-15T11:58:00.000Z',
        value: 21,
        min: 20,
        max: 22,
        sampleCount: 2,
      },
      {
        t: '2026-09-15T11:59:00.000Z',
        value: 30,
        min: 30,
        max: 30,
        sampleCount: 1,
      },
    ])
    // Every resynced id counts as applied, so its live event is not re-added.
    const replay = applyReading(
      next,
      reading(2, '2026-09-15T11:58:30.000Z', 22),
      'minute',
      { kind: 'relative', rangeMs: 6 * HOUR_MS },
      NOW,
    )
    expect(replay).toBe(next)
  })
})

describe('toLiveReading', () => {
  it('maps an INSERT payload row, normalising quality and clock trust', () => {
    expect(
      toLiveReading({
        id: 9,
        sensor_id: 'sensor-1',
        timestamp: '2026-09-15T11:59:00+00:00',
        value: 21.5,
        quality: 'weird',
        ts_source: 'server',
      }),
    ).toEqual({
      id: 9,
      t: '2026-09-15T11:59:00+00:00',
      value: 21.5,
      quality: 'ok',
      tsSource: 'server',
    })
  })
})
