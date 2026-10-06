import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HistoricalPoint } from '../domain/historicalPoint'
import type { LiveMeasurementRow, SeriesWindow } from '../domain/liveSeries'
import { MAX_RAW_ROWS, RawRowLimitError } from '../domain/rawRowLimit'
import { LIVE_QUEUE_CAP, useLiveSeries } from './useLiveSeries'

interface FakeSubscription {
  sensorId: string
  onInsert: (row: LiveMeasurementRow) => void
  onStatusChange: (status: 'connecting' | 'live' | 'down') => void
}

const liveClient = vi.hoisted(() => ({
  subscriptions: [] as FakeSubscription[],
  subscribeToSensorInserts: vi.fn(),
  unsubscribeFromSensorInserts: vi.fn(),
}))

const repository = vi.hoisted(() => ({
  fetchRawMeasurements: vi.fn(),
}))

vi.mock('../infrastructure/liveMeasurementsClient', () => liveClient)
vi.mock('../infrastructure/historyRepository', () => repository)

const SENSOR_ID = '0b5f6c1e-2d3a-4b5c-8d9e-0f1a2b3c4d5e'
const NOW = Date.parse('2026-09-15T12:00:00.000Z')
const HOUR_MS = 60 * 60 * 1000
const LAST_HOUR: SeriesWindow = { kind: 'relative', rangeMs: HOUR_MS }

function row(id: number, timestamp: string, value: number): LiveMeasurementRow {
  return {
    id,
    sensor_id: SENSOR_ID,
    timestamp,
    value,
    quality: 'ok',
    ts_source: 'device',
  }
}

function latestSubscription(): FakeSubscription {
  const subscription = liveClient.subscriptions.at(-1)
  if (!subscription) {
    throw new Error('no live subscription was opened')
  }
  return subscription
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  liveClient.subscriptions = []
  liveClient.subscribeToSensorInserts
    .mockReset()
    .mockImplementation(
      (sensorId: string, handlers: Omit<FakeSubscription, 'sensorId'>) => {
        const subscription = { sensorId, ...handlers }
        liveClient.subscriptions.push(subscription)
        return { topic: `fake-${liveClient.subscriptions.length}` }
      },
    )
  liveClient.unsubscribeFromSensorInserts.mockReset()
  repository.fetchRawMeasurements.mockReset().mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

const minuteBase: HistoricalPoint[] = [
  {
    t: '2026-09-15T11:59:00.000Z',
    value: 10,
    min: 10,
    max: 10,
    sampleCount: 1,
  },
]
const SIX_HOURS: SeriesWindow = { kind: 'relative', rangeMs: 6 * HOUR_MS }
const ENDED: SeriesWindow = {
  kind: 'fixed',
  fromMs: NOW - 2 * HOUR_MS,
  toMs: NOW - HOUR_MS,
}

const rawBase: HistoricalPoint[] = [
  { id: 1, t: '2026-09-15T11:58:00.000Z', value: 20, quality: 'ok' },
]

describe('useLiveSeries', () => {
  it('shows a reading delivered after SUBSCRIBED without reloading', () => {
    const { result } = renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'raw',
        basePoints: rawBase,
        isBaseReady: true,
        window: LAST_HOUR,
        onBaseStale: vi.fn(),
      }),
    )

    act(() => latestSubscription().onStatusChange('live'))
    act(() =>
      latestSubscription().onInsert(row(2, '2026-09-15T11:59:30.000Z', 22)),
    )

    expect(latestSubscription().sensorId).toBe(SENSOR_ID)
    expect(result.current.points.map((point) => point.value)).toEqual([20, 22])
  })

  it('backfills the gap from the last known timestamp after a reconnect', async () => {
    repository.fetchRawMeasurements.mockResolvedValue([
      { id: 1, t: '2026-09-15T11:58:00.000Z', value: 20, quality: 'ok' },
      { id: 3, t: '2026-09-15T11:59:00.000Z', value: 25, quality: 'ok' },
    ])
    const { result } = renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'raw',
        basePoints: rawBase,
        isBaseReady: true,
        window: LAST_HOUR,
        onBaseStale: vi.fn(),
      }),
    )

    act(() => latestSubscription().onStatusChange('live'))
    act(() => latestSubscription().onStatusChange('down'))
    act(() => latestSubscription().onStatusChange('live'))

    await waitFor(() =>
      expect(result.current.points.map((point) => point.id)).toEqual([1, 3]),
    )
    expect(repository.fetchRawMeasurements).toHaveBeenCalledWith(
      SENSOR_ID,
      '2026-09-15T11:58:00.000Z',
      new Date(NOW).toISOString(),
      { maxRows: MAX_RAW_ROWS },
    )
  })

  it('asks for a fresh load when the reconnect gap exceeds the raw row limit', async () => {
    repository.fetchRawMeasurements.mockRejectedValue(
      new RawRowLimitError(90_000, MAX_RAW_ROWS),
    )
    const onBaseStale = vi.fn()
    renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'raw',
        basePoints: rawBase,
        isBaseReady: true,
        window: LAST_HOUR,
        onBaseStale,
      }),
    )

    act(() => latestSubscription().onStatusChange('live'))
    act(() => latestSubscription().onStatusChange('down'))
    act(() => latestSubscription().onStatusChange('live'))

    await waitFor(() => expect(onBaseStale).toHaveBeenCalledOnce())
  })

  it('does not count a reading twice when it arrives while the newest bucket is reconciled', async () => {
    let resolveSeed: (points: HistoricalPoint[]) => void = () => {}
    repository.fetchRawMeasurements.mockReturnValue(
      new Promise<HistoricalPoint[]>((resolve) => {
        resolveSeed = resolve
      }),
    )
    const { result } = renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'minute',
        basePoints: minuteBase,
        isBaseReady: true,
        window: SIX_HOURS,
        onBaseStale: vi.fn(),
      }),
    )

    act(() => latestSubscription().onStatusChange('live'))
    act(() =>
      latestSubscription().onInsert(row(5, '2026-09-15T11:59:40.000Z', 16)),
    )
    await act(async () => {
      resolveSeed([
        { id: 4, t: '2026-09-15T11:59:10.000Z', value: 10, quality: 'ok' },
        { id: 5, t: '2026-09-15T11:59:40.000Z', value: 16, quality: 'ok' },
      ])
      await Promise.resolve()
    })

    expect(repository.fetchRawMeasurements).toHaveBeenCalledWith(
      SENSOR_ID,
      '2026-09-15T11:59:00.000Z',
      new Date(NOW).toISOString(),
      { maxRows: MAX_RAW_ROWS },
    )
    expect(result.current.points).toEqual([
      {
        t: '2026-09-15T11:59:00.000Z',
        value: 13,
        min: 10,
        max: 16,
        sampleCount: 2,
      },
    ])
  })

  it('does not subscribe for a custom range that already ended', () => {
    const { result } = renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'raw',
        basePoints: rawBase,
        isBaseReady: true,
        window: ENDED,
        onBaseStale: vi.fn(),
      }),
    )

    expect(liveClient.subscribeToSensorInserts).not.toHaveBeenCalled()
    expect(result.current.points).toEqual(rawBase)
  })

  it('ignores readings from a channel it already removed (StrictMode remount)', () => {
    const { result } = renderHook(
      () =>
        useLiveSeries({
          sensorId: SENSOR_ID,
          granularity: 'raw',
          basePoints: rawBase,
          isBaseReady: true,
          window: LAST_HOUR,
          onBaseStale: vi.fn(),
        }),
      { reactStrictMode: true },
    )
    const [removed, current] = liveClient.subscriptions
    if (!removed || !current) {
      throw new Error('StrictMode should have subscribed twice')
    }

    act(() => removed.onInsert(row(9, '2026-09-15T11:59:30.000Z', 99)))

    expect(result.current.points).toEqual(rawBase)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'raw',
        basePoints: rawBase,
        isBaseReady: true,
        window: LAST_HOUR,
        onBaseStale: vi.fn(),
      }),
    )

    unmount()

    expect(liveClient.unsubscribeFromSensorInserts).toHaveBeenCalledWith({
      topic: 'fake-1',
    })
  })

  it('asks for a fresh load when the reconnect backfill fails for any other reason', async () => {
    repository.fetchRawMeasurements.mockRejectedValue(new Error('network down'))
    const onBaseStale = vi.fn()
    renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'raw',
        basePoints: rawBase,
        isBaseReady: true,
        window: LAST_HOUR,
        onBaseStale,
      }),
    )

    act(() => latestSubscription().onStatusChange('live'))
    act(() => latestSubscription().onStatusChange('down'))
    act(() => latestSubscription().onStatusChange('live'))

    await waitFor(() => expect(onBaseStale).toHaveBeenCalledOnce())
  })

  it('backfills a drop that happened while the newest bucket was still being reconciled', async () => {
    let resolveSeed: (points: HistoricalPoint[]) => void = () => {}
    repository.fetchRawMeasurements
      .mockReturnValueOnce(
        new Promise<HistoricalPoint[]>((resolve) => {
          resolveSeed = resolve
        }),
      )
      .mockResolvedValue([])
    renderHook(() =>
      useLiveSeries({
        sensorId: SENSOR_ID,
        granularity: 'minute',
        basePoints: minuteBase,
        isBaseReady: true,
        window: SIX_HOURS,
        onBaseStale: vi.fn(),
      }),
    )

    act(() => latestSubscription().onStatusChange('live'))
    act(() => latestSubscription().onStatusChange('down'))
    act(() => latestSubscription().onStatusChange('live'))
    await act(async () => {
      resolveSeed([])
      await Promise.resolve()
    })

    await waitFor(() =>
      expect(repository.fetchRawMeasurements).toHaveBeenCalledTimes(2),
    )
  })

  it(`keeps only the newest ${LIVE_QUEUE_CAP} readings queued while the series cannot load`, () => {
    const { result, rerender } = renderHook(
      ({ isBaseReady }: { isBaseReady: boolean }) =>
        useLiveSeries({
          sensorId: SENSOR_ID,
          granularity: 'raw',
          basePoints: rawBase,
          isBaseReady,
          window: LAST_HOUR,
          onBaseStale: vi.fn(),
        }),
      { initialProps: { isBaseReady: false } },
    )
    const start = NOW - HOUR_MS / 2

    act(() => {
      for (let id = 10; id < 10 + LIVE_QUEUE_CAP + 1; id += 1) {
        latestSubscription().onInsert(
          row(id, new Date(start + id).toISOString(), id),
        )
      }
    })
    rerender({ isBaseReady: true })

    expect(result.current.points).toHaveLength(1 + LIVE_QUEUE_CAP)
    expect(result.current.points.some((point) => point.id === 10)).toBe(false)
  }, 30_000)
})
