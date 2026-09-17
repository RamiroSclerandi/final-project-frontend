import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DeviceManagementContainer } from './DeviceManagementContainer'

const useDevicesMock = vi.hoisted(() => vi.fn())
const useUpdateDeviceMock = vi.hoisted(() => vi.fn())
const useUpdateSensorMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useDevices', () => ({ useDevices: useDevicesMock }))
vi.mock('../application/useUpdateDevice', () => ({
  useUpdateDevice: useUpdateDeviceMock,
}))
vi.mock('../application/useUpdateSensor', () => ({
  useUpdateSensor: useUpdateSensorMock,
}))

describe('DeviceManagementContainer', () => {
  it('shows a loading state while devices are being fetched', () => {
    useDevicesMock.mockReturnValue({ data: undefined, isLoading: true })
    useUpdateDeviceMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })

    render(<DeviceManagementContainer />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the fetched devices once loaded', () => {
    useDevicesMock.mockReturnValue({
      data: [
        {
          id: 'device-1',
          macAddress: 'AABBCCDDEEFF',
          name: 'Kitchen node',
          locationRef: null,
          transport: 'wifi-mqtt',
          provisioned: true,
          sensors: [],
        },
      ],
      isLoading: false,
    })
    useUpdateDeviceMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })

    render(<DeviceManagementContainer />)

    expect(screen.getByDisplayValue('Kitchen node')).toBeInTheDocument()
  })

  it('shows an error for the device whose update failed, after isPending settles to false', () => {
    useDevicesMock.mockReturnValue({
      data: [
        {
          id: 'device-1',
          macAddress: 'AABBCCDDEEFF',
          name: 'Kitchen node',
          locationRef: null,
          transport: 'wifi-mqtt',
          provisioned: true,
          sensors: [],
        },
      ],
      isLoading: false,
    })
    useUpdateDeviceMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('boom'),
      variables: { deviceId: 'device-1', update: { name: 'Kitchen node' } },
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })

    render(<DeviceManagementContainer />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows an error for the sensor whose update failed, after isPending settles to false', () => {
    useDevicesMock.mockReturnValue({
      data: [
        {
          id: 'device-1',
          macAddress: 'AABBCCDDEEFF',
          name: 'Kitchen node',
          locationRef: null,
          transport: 'wifi-mqtt',
          provisioned: true,
          sensors: [
            {
              id: 'sensor-1',
              label: 'Fridge temp',
              pinConnection: null,
              source: 'DHT22',
              tag: '',
            },
          ],
        },
      ],
      isLoading: false,
    })
    useUpdateDeviceMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('boom'),
      variables: { sensorId: 'sensor-1', update: { label: 'Fridge temp' } },
    })

    render(<DeviceManagementContainer />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
