import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Device } from '../domain/device'
import { DEVICES_QUERY_KEY } from '../domain/queryKeys'
import { useUpdateDevice } from './useUpdateDevice'

const repositoryMocks = vi.hoisted(() => ({ updateDevice: vi.fn() }))

vi.mock('../infrastructure/deviceRepository', () => repositoryMocks)

const device: Device = {
  id: 'device-1',
  macAddress: 'AABBCCDDEEFF',
  name: 'Kitchen node',
  locationRef: null,
  transport: 'wifi-mqtt',
  provisioned: true,
  firmwareVersion: null,
  sensors: [],
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  repositoryMocks.updateDevice.mockReset()
})

describe('useUpdateDevice', () => {
  it('sends only the allowlisted update to updateDevice (REQ-DM-1/2)', async () => {
    repositoryMocks.updateDevice.mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useUpdateDevice(), {
      wrapper: createWrapper(queryClient),
    })

    act(() =>
      result.current.mutate({
        deviceId: 'device-1',
        update: { name: 'Renamed' },
      }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(repositoryMocks.updateDevice).toHaveBeenCalledWith('device-1', {
      name: 'Renamed',
    })
  })

  it('merges the update into the cached devices list on success', async () => {
    repositoryMocks.updateDevice.mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    queryClient.setQueryData(DEVICES_QUERY_KEY, [device])
    const { result } = renderHook(() => useUpdateDevice(), {
      wrapper: createWrapper(queryClient),
    })

    act(() =>
      result.current.mutate({
        deviceId: 'device-1',
        update: { name: 'Renamed' },
      }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(
      queryClient.getQueryData<Device[]>(DEVICES_QUERY_KEY)?.[0]?.name,
    ).toBe('Renamed')
  })
})
