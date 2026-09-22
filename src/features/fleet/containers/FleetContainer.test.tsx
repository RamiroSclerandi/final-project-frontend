import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { FleetContainer } from './FleetContainer'

const useDevicesMock = vi.hoisted(() => vi.fn())
const useDeviceStatusesMock = vi.hoisted(() => vi.fn())
const useRealtimeDeviceStatusesMock = vi.hoisted(() => vi.fn())
const useLatestReadingsMock = vi.hoisted(() => vi.fn())
const useRealtimeReadingsMock = vi.hoisted(() => vi.fn())

vi.mock('../../device-management', () => ({ useDevices: useDevicesMock }))
vi.mock('../../node-health', () => ({
  useDeviceStatuses: useDeviceStatusesMock,
  useRealtimeDeviceStatuses: useRealtimeDeviceStatusesMock,
}))
vi.mock('../../telemetry', () => ({
  useLatestReadings: useLatestReadingsMock,
  useRealtimeReadings: useRealtimeReadingsMock,
}))

const DEVICE_A = {
  id: 'device-a',
  name: 'Greenhouse A',
  locationRef: 'Row 1',
  transport: 'wifi-mqtt',
}

function mockHealthyDefaults() {
  useDeviceStatusesMock.mockReturnValue({ data: {} })
  useRealtimeDeviceStatusesMock.mockReturnValue(undefined)
  useLatestReadingsMock.mockReturnValue({ data: {} })
  useRealtimeReadingsMock.mockReturnValue({ status: 'live' })
}

describe('FleetContainer', () => {
  it('shows no table while devices are pending', () => {
    useDevicesMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    })
    mockHealthyDefaults()

    renderWithProviders(<FleetContainer />)

    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows a retry action when the devices query fails', async () => {
    const refetch = vi.fn()
    useDevicesMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    })
    mockHealthyDefaults()

    renderWithProviders(<FleetContainer />)

    expect(screen.getByText('Fleet unavailable')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Retry' }).click()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows the empty state for a fleet with zero devices', () => {
    useDevicesMock.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    mockHealthyDefaults()

    renderWithProviders(<FleetContainer />)

    expect(screen.getByText('No nodes yet')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('renders the fleet table and KPIs once devices, statuses, and readings resolve', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({
      data: { 'device-a': { online: true, lastSeen: '2026-09-22T10:05:00Z' } },
    })
    useRealtimeDeviceStatusesMock.mockReturnValue(undefined)
    useLatestReadingsMock.mockReturnValue({ data: {} })
    useRealtimeReadingsMock.mockReturnValue({ status: 'live' })

    renderWithProviders(<FleetContainer />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Greenhouse A' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 node')).toBeInTheDocument()
  })
})
