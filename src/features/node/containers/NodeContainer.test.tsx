import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { NodeContainer } from './NodeContainer'

const useDevicesMock = vi.hoisted(() => vi.fn())
const useDeviceStatusesMock = vi.hoisted(() => vi.fn())
const useRealtimeDeviceStatusesMock = vi.hoisted(() => vi.fn())
const useLatestReadingsMock = vi.hoisted(() => vi.fn())
const useRealtimeReadingsMock = vi.hoisted(() => vi.fn())

vi.mock('../../device-management', () => ({
  useDevices: useDevicesMock,
  DeviceConfigContainer: ({ deviceId }: { deviceId: string }) => (
    <p>Device config for {deviceId}</p>
  ),
}))
vi.mock('../../node-health', () => ({
  useDeviceStatuses: useDeviceStatusesMock,
  useRealtimeDeviceStatuses: useRealtimeDeviceStatusesMock,
}))
vi.mock('../../telemetry', () => ({
  useLatestReadings: useLatestReadingsMock,
  useRealtimeReadings: useRealtimeReadingsMock,
}))
vi.mock('../../remote-config', () => ({
  SamplingIntervalContainer: ({ deviceId }: { deviceId: string }) => (
    <p>Sampling interval for {deviceId}</p>
  ),
  useSamplingIntervals: () => ({}),
}))

const DEVICE_A = {
  id: 'device-a',
  name: 'Greenhouse A',
  macAddress: 'AABBCCDDEEFF',
  locationRef: 'Row 1',
  transport: 'wifi-mqtt',
  provisioned: true,
  firmwareVersion: '1.2.0',
  sensors: [],
}

function mockHealthyDefaults() {
  useDeviceStatusesMock.mockReturnValue({
    data: {},
    isError: false,
    refetch: vi.fn(),
  })
  useRealtimeDeviceStatusesMock.mockReturnValue(undefined)
  useLatestReadingsMock.mockReturnValue({
    data: {},
    isError: false,
    refetch: vi.fn(),
  })
  useRealtimeReadingsMock.mockReturnValue({ status: 'live' })
}

describe('NodeContainer', () => {
  it('shows no header while devices are pending', () => {
    useDevicesMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    })
    mockHealthyDefaults()

    renderWithProviders(<NodeContainer deviceId="device-a" />)

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('shows a retry action when the devices query fails', () => {
    const refetch = vi.fn()
    useDevicesMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    })
    mockHealthyDefaults()

    renderWithProviders(<NodeContainer deviceId="device-a" />)

    screen.getByRole('button', { name: 'Retry' }).click()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows a not-found empty state with a link back to / when the deviceId matches no device', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    mockHealthyDefaults()

    renderWithProviders(<NodeContainer deviceId="device-unknown" />)

    expect(screen.getByText('Node not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to fleet' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('refetches devices when a live reading names a sensor the cache does not know', () => {
    const refetchDevices = vi.fn()
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: refetchDevices,
    })
    mockHealthyDefaults()

    renderWithProviders(<NodeContainer deviceId="device-a" />)
    const [options] = useRealtimeReadingsMock.mock.lastCall ?? []
    options?.onUnknownSensor?.()

    expect(refetchDevices).toHaveBeenCalledOnce()
  })

  it('renders the node header once the device resolves', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({
      data: { 'device-a': { online: true, lastSeen: '2026-09-22T10:05:00Z' } },
      isError: false,
      refetch: vi.fn(),
    })
    useRealtimeDeviceStatusesMock.mockReturnValue(undefined)
    useLatestReadingsMock.mockReturnValue({
      data: {},
      isError: false,
      refetch: vi.fn(),
    })
    useRealtimeReadingsMock.mockReturnValue({ status: 'live' })

    renderWithProviders(<NodeContainer deviceId="device-a" />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Greenhouse A' }),
    ).toBeInTheDocument()
  })

  it('groups this device readings by channel into one SensorGroup table per magnitude', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({
      data: { 'device-a': { online: true, lastSeen: '2026-09-22T10:05:00Z' } },
      isError: false,
      refetch: vi.fn(),
    })
    useRealtimeDeviceStatusesMock.mockReturnValue(undefined)
    useLatestReadingsMock.mockReturnValue({
      data: {
        's-voltage': {
          sensorId: 's-voltage',
          deviceId: 'device-a',
          value: 220,
          timestamp: '2026-09-22T10:00:00Z',
          quality: 'ok',
          channel: 'voltage',
          unit: 'V',
          sensorLabel: null,
          sensorTag: '',
          deviceName: 'Greenhouse A',
          rssi: -65,
        },
        's-other-device': {
          sensorId: 's-other-device',
          deviceId: 'device-b',
          value: 1,
          timestamp: '2026-09-22T10:00:00Z',
          quality: 'ok',
          channel: 'current',
          unit: 'A',
          sensorLabel: null,
          sensorTag: '',
          deviceName: 'Greenhouse B',
          rssi: null,
        },
      },
      isError: false,
      refetch: vi.fn(),
    })
    useRealtimeReadingsMock.mockReturnValue({ status: 'live' })

    renderWithProviders(<NodeContainer deviceId="device-a" />)

    expect(screen.getAllByRole('table')).toHaveLength(1)
    // Channel labels are translated now (debt fix) -- "voltage" renders as
    // "Voltage", so this must be case-insensitive.
    expect(screen.getByText(/voltage/i)).toBeInTheDocument()
    expect(screen.queryByText(/current/i)).toBeNull()
  })

  it('opens the config drawer with both device sections when Configure is clicked', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    mockHealthyDefaults()

    renderWithProviders(<NodeContainer deviceId="device-a" />)

    const dialog = document.querySelector('dialog')
    expect(dialog).not.toBeNull()
    expect(dialog).not.toHaveAttribute('open')

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }))

    expect(dialog).toHaveAttribute('open')
    expect(screen.getByText('Device config for device-a')).toBeInTheDocument()
    expect(
      screen.getByText('Sampling interval for device-a'),
    ).toBeInTheDocument()
  })
})
