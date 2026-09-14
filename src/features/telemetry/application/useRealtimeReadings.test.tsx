import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  LATEST_READINGS_QUERY_KEY,
  LIVE_SERIES_QUERY_KEY,
} from '../domain/queryKeys'
import { useRealtimeReadings } from './useRealtimeReadings'

const realtimeClientMocks = vi.hoisted(() => ({
  subscribeToMeasurementInserts: vi.fn(),
  unsubscribeFromMeasurements: vi.fn(),
}))

vi.mock(
  '../infrastructure/realtimeMeasurementsClient',
  () => realtimeClientMocks,
)

const FAKE_CHANNEL = { name: 'fake-channel' }

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useRealtimeReadings', () => {
  let onInsert: (row: {
    sensor_id: string
    value: number
    timestamp: string
    quality: string
  }) => void
  let onStatusChange: (status: string) => void

  beforeEach(() => {
    vi.resetAllMocks()
    realtimeClientMocks.subscribeToMeasurementInserts.mockImplementation(
      ({
        onInsert: insert,
        onStatusChange: statusChange,
      }: {
        onInsert: typeof onInsert
        onStatusChange: typeof onStatusChange
      }) => {
        onInsert = insert
        onStatusChange = statusChange
        return FAKE_CHANNEL
      },
    )
  })

  it('subscribes exactly once on mount and starts connecting', () => {
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useRealtimeReadings(), {
      wrapper: createWrapper(queryClient),
    })

    expect(
      realtimeClientMocks.subscribeToMeasurementInserts,
    ).toHaveBeenCalledOnce()
    expect(result.current.status).toBe('connecting')
  })

  it('unsubscribes the channel on unmount', () => {
    const queryClient = new QueryClient()
    const { unmount } = renderHook(() => useRealtimeReadings(), {
      wrapper: createWrapper(queryClient),
    })

    unmount()

    expect(
      realtimeClientMocks.unsubscribeFromMeasurements,
    ).toHaveBeenCalledWith(FAKE_CHANNEL)
  })

  it('reflects the mapped connection status', () => {
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useRealtimeReadings(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => onStatusChange('live'))

    expect(result.current.status).toBe('live')
  })

  it('routes an insert into the latest-readings cache for its sensor only (REQ-RT-2)', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(LATEST_READINGS_QUERY_KEY, {
      'sensor-a': {
        sensorId: 'sensor-a',
        value: 1,
        timestamp: 't0',
        quality: 'ok',
        channel: 'c',
        unit: 'u',
        sensorLabel: null,
        deviceName: 'A',
      },
    })
    renderHook(() => useRealtimeReadings(), {
      wrapper: createWrapper(queryClient),
    })

    act(() =>
      onInsert({
        sensor_id: 'sensor-a',
        value: 5,
        timestamp: 't1',
        quality: 'ok',
      }),
    )

    expect(queryClient.getQueryData(LATEST_READINGS_QUERY_KEY)).toEqual({
      'sensor-a': {
        sensorId: 'sensor-a',
        value: 5,
        timestamp: 't1',
        quality: 'ok',
        channel: 'c',
        unit: 'u',
        sensorLabel: null,
        deviceName: 'A',
      },
    })
  })

  it('appends the insert to the live-series ring for its sensor', () => {
    const queryClient = new QueryClient()
    renderHook(() => useRealtimeReadings(), {
      wrapper: createWrapper(queryClient),
    })

    act(() =>
      onInsert({
        sensor_id: 'sensor-a',
        value: 5,
        timestamp: 't1',
        quality: 'ok',
      }),
    )

    expect(queryClient.getQueryData(LIVE_SERIES_QUERY_KEY)).toEqual({
      'sensor-a': [{ timestamp: 't1', value: 5 }],
    })
  })

  it('invalidates latest-readings only on a re-SUBSCRIBED after a real disconnect (D-2 reconnect policy)', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    renderHook(() => useRealtimeReadings(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => onStatusChange('live'))
    expect(invalidateSpy).not.toHaveBeenCalled()

    act(() => onStatusChange('down'))
    act(() => onStatusChange('live'))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: LATEST_READINGS_QUERY_KEY,
    })
  })
})
