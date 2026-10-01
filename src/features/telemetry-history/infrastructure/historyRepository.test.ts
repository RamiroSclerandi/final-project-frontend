import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RawRowLimitError } from '../domain/rawRowLimit'
import { fetchHourlyAggregate, fetchRawMeasurements } from './historyRepository'

const POSTGREST_MAX_ROWS = 1000

const fakeDb = vi.hoisted(() => ({
  rows: [] as object[],
  count: undefined as number | null | undefined,
  pageRequests: 0,
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
        const [from, to] = window ?? [0, Infinity]
        const end = Math.min(to + 1, from + POSTGREST_MAX_ROWS)
        resolve({ data: fakeDb.rows.slice(from, end), error: null })
      },
    }
    return builder
  }
  return {
    supabase: {
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
})
