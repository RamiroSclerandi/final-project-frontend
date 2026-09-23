import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { DeviceConfigContainer } from './DeviceConfigContainer'

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

describe('DeviceConfigContainer', () => {
  it('shows no device form while devices are being fetched', () => {
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

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('renders the matching device once loaded', () => {
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

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    expect(screen.getByDisplayValue('Kitchen node')).toBeInTheDocument()
  })

  it('renders nothing for a deviceId not present in the fetched devices', () => {
    useDevicesMock.mockReturnValue({ data: [], isLoading: false })
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

    const { container } = renderWithProviders(
      <DeviceConfigContainer deviceId="device-unknown" />,
    )

    expect(container).toBeEmptyDOMElement()
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
      reset: vi.fn(),
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      reset: vi.fn(),
    })

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

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
      reset: vi.fn(),
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('boom'),
      variables: { sensorId: 'sensor-1', update: { label: 'Fridge temp' } },
      reset: vi.fn(),
    })

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('dismisses the error and resets both mutations when Dismiss is clicked (REQ-CFG-4)', () => {
    const resetDevice = vi.fn()
    const resetSensor = vi.fn()
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
      reset: resetDevice,
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      reset: resetSensor,
    })

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(resetDevice).toHaveBeenCalledOnce()
    expect(resetSensor).toHaveBeenCalledOnce()
  })
})
