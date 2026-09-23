import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Device } from '../domain/device'
import { DEVICES_QUERY_KEY } from '../domain/queryKeys'
import { useUpdateSensor } from './useUpdateSensor'

const repositoryMocks = vi.hoisted(() => ({ updateSensor: vi.fn() }))

vi.mock('../infrastructure/deviceRepository', () => repositoryMocks)

const device: Device = {
  id: 'device-1',
  macAddress: 'AABBCCDDEEFF',
  name: 'Kitchen node',
  locationRef: null,
  transport: 'wifi-mqtt',
  provisioned: true,
  firmwareVersion: null,
  sensors: [
    {
      id: 'sensor-1',
      label: 'Old',
      pinConnection: null,
      source: 'DHT22',
      tag: '',
    },
  ],
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  repositoryMocks.updateSensor.mockReset()
})

describe('useUpdateSensor', () => {
  it('sends only label/pin_connection to updateSensor (REQ-DM-3)', async () => {
    repositoryMocks.updateSensor.mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useUpdateSensor(), {
      wrapper: createWrapper(queryClient),
    })

    act(() =>
      result.current.mutate({ sensorId: 'sensor-1', update: { label: 'New' } }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(repositoryMocks.updateSensor).toHaveBeenCalledWith('sensor-1', {
      label: 'New',
    })
  })

  it('merges the update into the matching nested sensor on success', async () => {
    repositoryMocks.updateSensor.mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    queryClient.setQueryData(DEVICES_QUERY_KEY, [device])
    const { result } = renderHook(() => useUpdateSensor(), {
      wrapper: createWrapper(queryClient),
    })

    act(() =>
      result.current.mutate({ sensorId: 'sensor-1', update: { label: 'New' } }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(
      queryClient.getQueryData<Device[]>(DEVICES_QUERY_KEY)?.[0]?.sensors[0]
        ?.label,
    ).toBe('New')
  })
})
