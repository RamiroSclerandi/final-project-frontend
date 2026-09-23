import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
