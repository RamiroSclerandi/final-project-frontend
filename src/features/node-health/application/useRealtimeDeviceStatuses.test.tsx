import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEVICE_STATUSES_QUERY_KEY } from '../domain/queryKeys'
import { useRealtimeDeviceStatuses } from './useRealtimeDeviceStatuses'

const realtimeClientMocks = vi.hoisted(() => ({
  subscribeToDeviceUpdates: vi.fn(),
  unsubscribeFromDevices: vi.fn(),
}))

vi.mock('../infrastructure/realtimeDevicesClient', () => realtimeClientMocks)

const FAKE_CHANNEL = { name: 'fake-devices-channel' }

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useRealtimeDeviceStatuses', () => {
  let onUpdate: (row: {
    id: string
    name: string
    status: boolean
    last_seen: string | null
  }) => void

  beforeEach(() => {
    vi.resetAllMocks()
    realtimeClientMocks.subscribeToDeviceUpdates.mockImplementation(
      ({ onUpdate: update }: { onUpdate: typeof onUpdate }) => {
        onUpdate = update
        return FAKE_CHANNEL
      },
    )
  })

  it('subscribes exactly once on mount', () => {
    const queryClient = new QueryClient()
    renderHook(() => useRealtimeDeviceStatuses(), {
      wrapper: createWrapper(queryClient),
    })

    expect(realtimeClientMocks.subscribeToDeviceUpdates).toHaveBeenCalledOnce()
  })

  it('unsubscribes the channel on unmount', () => {
    const queryClient = new QueryClient()
    const { unmount } = renderHook(() => useRealtimeDeviceStatuses(), {
      wrapper: createWrapper(queryClient),
    })

    unmount()

    expect(realtimeClientMocks.unsubscribeFromDevices).toHaveBeenCalledWith(
      FAKE_CHANNEL,
    )
  })

  it('applies an update into the device-statuses cache for that device only (REQ-NH-1)', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(DEVICE_STATUSES_QUERY_KEY, {
      'device-a': {
        deviceId: 'device-a',
        name: 'Node A',
        online: true,
        lastSeen: null,
      },
    })
    renderHook(() => useRealtimeDeviceStatuses(), {
      wrapper: createWrapper(queryClient),
    })

    act(() =>
      onUpdate({
        id: 'device-a',
        name: 'Node A',
        status: false,
        last_seen: '2026-09-14T12:00:00Z',
      }),
    )

    expect(queryClient.getQueryData(DEVICE_STATUSES_QUERY_KEY)).toEqual({
      'device-a': {
        deviceId: 'device-a',
        name: 'Node A',
        online: false,
        lastSeen: '2026-09-14T12:00:00Z',
      },
    })
  })
})
