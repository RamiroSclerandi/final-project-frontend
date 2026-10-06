import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RawRowLimitError } from '../domain/rawRowLimit'
import {
  fetchHourlyAggregate,
  fetchRawMeasurements,
  fetchSensorSeries,
} from './historyRepository'

const POSTGREST_MAX_ROWS = 1000

const fakeDb = vi.hoisted(() => ({
  rows: [] as object[],
  count: undefined as number | null | undefined,
  pageRequests: 0,
  rpcCalls: [] as { fn: string; args: object }[],
  error: null as { message: string } | null,
}))

vi.mock('../../../shared/api/supabase', () => {
  // Behaves like PostgREST: every response is capped at max_rows, `.range()`
  // selects a window, and a `head` request returns only the exact count.
  const query = (head: boolean) => {
    let window: [number, number] | null = null
    const builder = {
      eq: () => builder,
      gte: () => builder,
      lte: () => builder,
      order: () => builder,
      range: (from: number, to: number) => {
        window = [from, to]
        return builder
      },
      then: (resolve: (value: unknown) => void) => {
        if (head) {
          resolve({
            data: null,
            error: null,
            count:
              fakeDb.count === undefined ? fakeDb.rows.length : fakeDb.count,
          })
          return
        }
        fakeDb.pageRequests += 1
        if (fakeDb.error) {
          resolve({ data: null, error: fakeDb.error })
          return
        }
        const [from, to] = window ?? [0, Infinity]
        const end = Math.min(to + 1, from + POSTGREST_MAX_ROWS)
        resolve({ data: fakeDb.rows.slice(from, end), error: null })
      },
    }
    return builder
  }
  return {
    supabase: {
      rpc: (fn: string, args: object) => {
        fakeDb.rpcCalls.push({ fn, args })
        return query(false)
      },
      from: () => ({
        select: (_columns: string, options?: { head?: boolean }) =>
          query(options?.head ?? false),
      }),
    },
  }
})

function hourlyBuckets(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    bucket: new Date(Date.UTC(2026, 0, 1, index)).toISOString(),
    avg_value: index,
    min_value: index,
    max_value: index,
    sample_count: 1,
  }))
}

function rawRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    value: index,
    quality: 'ok',
    ts_source: 'device',
  }))
}

describe('historyRepository', () => {
  beforeEach(() => {
    fakeDb.rows = []
    fakeDb.count = undefined
    fakeDb.pageRequests = 0
    fakeDb.rpcCalls = []
    fakeDb.error = null
  })

  it('returns every hourly bucket of a range larger than one PostgREST page', async () => {
    fakeDb.rows = hourlyBuckets(2500)

    const points = await fetchHourlyAggregate('sensor-1', 'from', 'to')

    expect(points).toHaveLength(2500)
    expect(points.at(-1)?.value).toBe(2499)
  })

  it('returns every raw row across pages when no row limit is given', async () => {
    fakeDb.rows = rawRows(2500)

    const points = await fetchRawMeasurements('sensor-1', 'from', 'to')

    expect(points).toHaveLength(2500)
  })

  it('refuses a raw range above the row limit before downloading it', async () => {
    fakeDb.rows = rawRows(1500)

    await expect(
      fetchRawMeasurements('sensor-1', 'from', 'to', { maxRows: 1000 }),
    ).rejects.toBeInstanceOf(RawRowLimitError)
    expect(fakeDb.pageRequests).toBe(0)
  })

  it('refuses a raw range whose row count cannot be determined', async () => {
    fakeDb.rows = rawRows(10)
    fakeDb.count = null

    await expect(
      fetchRawMeasurements('sensor-1', 'from', 'to', { maxRows: 1000 }),
    ).rejects.toThrow(/count/i)
    expect(fakeDb.pageRequests).toBe(0)
  })

  it('returns every minute bucket of a 24-hour series across PostgREST pages', async () => {
    fakeDb.rows = Array.from({ length: 1440 }, (_, index) => ({
      bucket: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      avg_value: index + 0.5,
      min_value: index,
      max_value: index + 1,
      sample_count: 2,
    }))

    const points = await fetchSensorSeries(
      'sensor-1',
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
      'minute',
    )

    expect(points).toHaveLength(1440)
    expect(points.at(-1)).toEqual({
      t: '2026-01-01T23:59:00.000Z',
      value: 1439.5,
      min: 1439,
      max: 1440,
      sampleCount: 2,
    })
    expect(fakeDb.rpcCalls[0]).toEqual({
      fn: 'get_sensor_series',
      args: {
        p_sensor_id: 'sensor-1',
        p_from: '2026-01-01T00:00:00.000Z',
        p_to: '2026-01-02T00:00:00.000Z',
        p_bucket: 'minute',
      },
    })
  })

  it('surfaces a series request the server rejects', async () => {
    fakeDb.error = {
      message: "get_sensor_series: range too wide for p_bucket 'minute'",
    }

    await expect(
      fetchSensorSeries('sensor-1', 'from', 'to', 'minute'),
    ).rejects.toEqual(fakeDb.error)
  })
})
