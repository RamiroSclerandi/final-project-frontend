import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_RAW_ROWS, RawRowLimitError } from '../domain/rawRowLimit'
import { useHistoricalSeries } from './useHistoricalSeries'

const repositoryMocks = vi.hoisted(() => ({
  fetchRawMeasurements: vi.fn(),
  fetchHourlyAggregate: vi.fn(),
  fetchDailyAggregate: vi.fn(),
  fetchLatestMeasurement: vi.fn(),
}))

vi.mock('../infrastructure/historyRepository', () => repositoryMocks)

const SENSOR_ID = 'sensor-1'
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  repositoryMocks.fetchRawMeasurements.mockReset().mockResolvedValue([])
  repositoryMocks.fetchHourlyAggregate.mockReset().mockResolvedValue([])
  repositoryMocks.fetchDailyAggregate.mockReset().mockResolvedValue([])
  repositoryMocks.fetchLatestMeasurement.mockReset().mockResolvedValue(null)
})

describe('useHistoricalSeries', () => {
  it('picks raw and calls fetchRawMeasurements for a sub-24h range', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - HOUR_MS)
    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      {
        wrapper: createWrapper(),
      },
    )

    expect(result.current.granularity).toBe('raw')
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(repositoryMocks.fetchRawMeasurements).toHaveBeenCalledWith(
      SENSOR_ID,
      from.toISOString(),
      to.toISOString(),
      { maxRows: MAX_RAW_ROWS },
    )
  })

  it('falls back to hourly data when an auto raw range exceeds the row limit', async () => {
    const bucket = {
      t: '2026-09-15T11:00:00Z',
      value: 21,
      min: 20,
      max: 22,
      sampleCount: 3600,
    }
    repositoryMocks.fetchRawMeasurements.mockRejectedValueOnce(
      new RawRowLimitError(86_400, MAX_RAW_ROWS),
    )
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([
      bucket,
      { ...bucket, t: '2026-09-15T12:00:00Z' },
    ])
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 20 * HOUR_MS)

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.granularity).toBe('hourly')
    expect(result.current.points).toContainEqual(bucket)
  })

  it('surfaces the row limit when raw data was requested explicitly', async () => {
    repositoryMocks.fetchRawMeasurements.mockRejectedValue(
      new RawRowLimitError(86_400, MAX_RAW_ROWS),
    )
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 20 * HOUR_MS)

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to, 'raw'),
      { wrapper: createWrapper() },
    )

    await waitFor(() =>
      expect(result.current.error).toBeInstanceOf(RawRowLimitError),
    )
  })

  it('picks hourly and calls fetchHourlyAggregate for a 7-day range', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 7 * DAY_MS)
    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.granularity).toBe('hourly')
    expect(repositoryMocks.fetchHourlyAggregate).toHaveBeenCalledWith(
      SENSOR_ID,
      from.toISOString(),
      to.toISOString(),
    )
  })

  it('picks daily and calls fetchDailyAggregate for a 120-day range', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 120 * DAY_MS)
    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.granularity).toBe('daily')
    expect(repositoryMocks.fetchDailyAggregate).toHaveBeenCalledWith(
      SENSOR_ID,
      from.toISOString(),
      to.toISOString(),
    )
  })

  it('exposes the resolved points and a queryDurationMs', async () => {
    const point = {
      t: '2026-09-15T11:00:00Z',
      value: 21.5,
      quality: 'ok' as const,
    }
    repositoryMocks.fetchRawMeasurements.mockResolvedValue([point])
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - HOUR_MS)
    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => expect(result.current.points).toEqual([point]))
    expect(result.current.queryDurationMs).toBeGreaterThanOrEqual(0)
  })

  it('propagates a query error instead of throwing', async () => {
    repositoryMocks.fetchRawMeasurements.mockRejectedValue(new Error('boom'))
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - HOUR_MS)
    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.points).toEqual([])
  })

  it('uses the explicit granularity override instead of the computed one (REQ-HS-8)', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 2 * DAY_MS) // would resolve to 'hourly' unaided
    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to, 'daily'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.granularity).toBe('daily')
    expect(repositoryMocks.fetchDailyAggregate).toHaveBeenCalled()
    expect(repositoryMocks.fetchHourlyAggregate).not.toHaveBeenCalled()
  })

  it('falls back to chooseGranularity when the override is "auto" (REQ-HS-8)', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 2 * DAY_MS)
    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to, 'auto'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.granularity).toBe('hourly')
    expect(repositoryMocks.fetchHourlyAggregate).toHaveBeenCalled()
  })

  it('merges the raw tail into the hourly aggregate (REQ-HS-3, D-3)', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 7 * DAY_MS)
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([
      { t: '2026-09-15T10:00:00.000Z', value: 20 },
      { t: '2026-09-15T11:00:00.000Z', value: 21 },
    ])
    repositoryMocks.fetchRawMeasurements.mockResolvedValue([
      { t: '2026-09-15T11:30:00Z', value: 22, quality: 'ok' },
    ])

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(repositoryMocks.fetchRawMeasurements).toHaveBeenCalledWith(
      SENSOR_ID,
      '2026-09-15T11:00:00.000Z',
      to.toISOString(),
      { maxRows: MAX_RAW_ROWS },
    )
    expect(result.current.points).toEqual([
      { t: '2026-09-15T10:00:00.000Z', value: 20 },
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 22,
        min: 22,
        max: 22,
        sampleCount: 1,
        partial: true,
      },
    ])
    expect(result.current.aggregationStale).toBe(false)
  })

  it('keeps the hourly buckets and flags staleness when the raw tail exceeds the row limit', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 7 * DAY_MS)
    const buckets = [
      { t: '2026-09-10T10:00:00.000Z', value: 20 },
      { t: '2026-09-10T11:00:00.000Z', value: 21 },
    ]
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue(buckets)
    repositoryMocks.fetchRawMeasurements.mockRejectedValue(
      new RawRowLimitError(90_000, MAX_RAW_ROWS),
    )

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.points).toEqual(buckets)
    expect(result.current.aggregationStale).toBe(true)
  })

  it('merges the latest reading into the daily aggregate as a partial marker (D-3)', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 120 * DAY_MS)
    repositoryMocks.fetchDailyAggregate.mockResolvedValue([
      { t: '2026-09-13T00:00:00.000Z', value: 20 },
      { t: '2026-09-14T00:00:00.000Z', value: 21 },
    ])
    repositoryMocks.fetchLatestMeasurement.mockResolvedValue({
      t: '2026-09-15T09:00:00Z',
      value: 23,
      quality: 'ok',
    })

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(repositoryMocks.fetchLatestMeasurement).toHaveBeenCalledWith(
      SENSOR_ID,
    )
    expect(result.current.points).toEqual([
      { t: '2026-09-13T00:00:00.000Z', value: 20 },
      {
        t: '2026-09-15T09:00:00Z',
        value: 23,
        quality: 'ok',
        partial: true,
      },
    ])
  })

  it('is not stale when neither a bucket nor a raw measurement exist yet (REQ-HS-7)', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 7 * DAY_MS)
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([])

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.aggregationStale).toBe(false)
  })

  it('is stale when a raw measurement exists but the hourly matview has no bucket yet (REQ-HS-7)', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 7 * DAY_MS)
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([])
    repositoryMocks.fetchLatestMeasurement.mockResolvedValue({
      t: '2026-09-15T09:00:00Z',
      value: 23,
      quality: 'ok',
    })

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.aggregationStale).toBe(true)
  })

  it('compares the hourly bucket to the newest raw measurement, not the query range end (REQ-HS-7)', async () => {
    // Discriminator: bucket 08:00, newest raw 09:00, toIso 12:00 -- fresh
    // against the raw measurement (1h < 2h budget), even though 08:00 is
    // 4h behind toIso.
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 7 * DAY_MS)
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([
      { t: '2026-09-15T08:00:00.000Z', value: 19 },
    ])
    repositoryMocks.fetchLatestMeasurement.mockResolvedValue({
      t: '2026-09-15T09:00:00Z',
      value: 23,
      quality: 'ok',
    })

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(repositoryMocks.fetchLatestMeasurement).toHaveBeenCalledWith(
      SENSOR_ID,
    )
    expect(result.current.aggregationStale).toBe(false)
  })

  it('compares the daily bucket to the newest raw measurement, not the query range end (REQ-HS-7)', async () => {
    // Discriminator: bucket 2026-09-10, newest raw 2026-09-11T12:00 -- only
    // 1.5 days apart, inside the 2-day daily budget. Comparing against
    // toIso (2026-09-15, 5.5 days away) would wrongly call this stale.
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 120 * DAY_MS)
    repositoryMocks.fetchDailyAggregate.mockResolvedValue([
      { t: '2026-09-10T00:00:00.000Z', value: 20 },
    ])
    repositoryMocks.fetchLatestMeasurement.mockResolvedValue({
      t: '2026-09-11T12:00:00Z',
      value: 23,
      quality: 'ok',
    })

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.aggregationStale).toBe(false)
  })

  it('buckets raw rows by minute for a 24-hour range, without touching the hourly matview', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - DAY_MS)
    repositoryMocks.fetchRawMeasurements.mockResolvedValue([
      { t: '2026-09-15T11:58:10Z', value: 20, quality: 'ok' },
      { t: '2026-09-15T11:58:40Z', value: 22, quality: 'ok' },
      { t: '2026-09-15T11:59:10Z', value: 25, quality: 'ok' },
    ])

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.granularity).toBe('minute')
    expect(repositoryMocks.fetchHourlyAggregate).not.toHaveBeenCalled()
    expect(result.current.points).toEqual([
      {
        t: '2026-09-15T11:58:00.000Z',
        value: 21,
        min: 20,
        max: 22,
        sampleCount: 2,
      },
      {
        t: '2026-09-15T11:59:00.000Z',
        value: 25,
        min: 25,
        max: 25,
        sampleCount: 1,
      },
    ])
  })

  it('shows data for a 24-hour range while the hourly matview is still empty', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - DAY_MS)
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([])
    repositoryMocks.fetchRawMeasurements.mockResolvedValue([
      { t: '2026-09-15T11:59:10Z', value: 25, quality: 'ok' },
    ])

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.points).toHaveLength(1)
  })

  it('falls back to hourly data when an auto minute range exceeds the raw row limit', async () => {
    const bucket = { t: '2026-09-15T11:00:00.000Z', value: 21 }
    repositoryMocks.fetchRawMeasurements.mockRejectedValueOnce(
      new RawRowLimitError(86_400, MAX_RAW_ROWS),
    )
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([
      { t: '2026-09-15T10:00:00.000Z', value: 20 },
      bucket,
    ])
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - DAY_MS)

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.granularity).toBe('hourly')
    expect(result.current.points[0]).toEqual({
      t: '2026-09-15T10:00:00.000Z',
      value: 20,
    })
  })

  it('surfaces the row limit when minute data was requested explicitly', async () => {
    repositoryMocks.fetchRawMeasurements.mockRejectedValue(
      new RawRowLimitError(86_400, MAX_RAW_ROWS),
    )
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - DAY_MS)

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to, 'minute'),
      { wrapper: createWrapper() },
    )

    await waitFor(() =>
      expect(result.current.error).toBeInstanceOf(RawRowLimitError),
    )
  })

  it('fills an hourly range from raw rows when the matview has no bucket yet', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 15 * DAY_MS)
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([])
    repositoryMocks.fetchLatestMeasurement.mockResolvedValue({
      t: '2026-09-15T11:40:00Z',
      value: 24,
      quality: 'ok',
    })
    repositoryMocks.fetchRawMeasurements.mockResolvedValue([
      { t: '2026-09-15T10:10:00Z', value: 20, quality: 'ok' },
      { t: '2026-09-15T11:20:00Z', value: 22, quality: 'ok' },
      { t: '2026-09-15T11:40:00Z', value: 24, quality: 'ok' },
    ])

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(repositoryMocks.fetchRawMeasurements).toHaveBeenCalledWith(
      SENSOR_ID,
      from.toISOString(),
      to.toISOString(),
      { maxRows: MAX_RAW_ROWS },
    )
    expect(result.current.points).toEqual([
      {
        t: '2026-09-15T10:00:00.000Z',
        value: 20,
        min: 20,
        max: 20,
        sampleCount: 1,
        partial: true,
      },
      {
        t: '2026-09-15T11:00:00.000Z',
        value: 23,
        min: 22,
        max: 24,
        sampleCount: 2,
        partial: true,
      },
    ])
  })

  it('shows the latest reading when the matview is empty and the raw range exceeds the row limit', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 60 * DAY_MS)
    const latest = {
      t: '2026-09-15T11:40:00Z',
      value: 24,
      quality: 'ok' as const,
    }
    repositoryMocks.fetchHourlyAggregate.mockResolvedValue([])
    repositoryMocks.fetchLatestMeasurement.mockResolvedValue(latest)
    repositoryMocks.fetchRawMeasurements.mockRejectedValue(
      new RawRowLimitError(90_000, MAX_RAW_ROWS),
    )

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.points).toEqual([{ ...latest, partial: true }])
    expect(result.current.aggregationStale).toBe(true)
  })

  it('returns no points when the range holds no measurements at all', async () => {
    const to = new Date('2026-09-15T12:00:00Z')
    const from = new Date(to.getTime() - 15 * DAY_MS)

    const { result } = renderHook(
      () => useHistoricalSeries(SENSOR_ID, from, to),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.points).toEqual([])
  })
})
