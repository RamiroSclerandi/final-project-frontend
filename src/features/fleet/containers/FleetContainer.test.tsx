import { fireEvent, screen } from '@testing-library/react'
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
vi.mock('../../remote-config', () => ({ useSamplingIntervals: () => ({}) }))

const JUST_NOW = new Date().toISOString()

const DEVICE_A = {
  id: 'device-a',
  name: 'Greenhouse A',
  locationRef: 'Row 1',
  transport: 'wifi-mqtt',
}

const DEVICE_B = {
  id: 'device-b',
  name: 'Greenhouse B',
  locationRef: 'Row 2',
  transport: 'lorawan',
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

  // PR-4 debt R3-status-readings-errors-silent: only the devices query drove
  // the error state, so a failed statuses/readings query rendered the table
  // with silently-wrong data instead of an error.
  it('surfaces the error state when the statuses query fails, not only the devices query', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({ data: {}, isError: true })
    useRealtimeDeviceStatusesMock.mockReturnValue(undefined)
    useLatestReadingsMock.mockReturnValue({ data: {}, isError: false })
    useRealtimeReadingsMock.mockReturnValue({ status: 'live' })

    renderWithProviders(<FleetContainer />)

    expect(screen.getByText('Fleet unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('surfaces the error state when the readings query fails, not only the devices query', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({ data: {}, isError: false })
    useRealtimeDeviceStatusesMock.mockReturnValue(undefined)
    useLatestReadingsMock.mockReturnValue({ data: {}, isError: true })
    useRealtimeReadingsMock.mockReturnValue({ status: 'live' })

    renderWithProviders(<FleetContainer />)

    expect(screen.getByText('Fleet unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
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
      data: { 'device-a': { online: true, lastSeen: JUST_NOW } },
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

  it('narrows the rendered rows to offline nodes once the Offline filter chip is selected (REQ-FLEET-4)', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A, DEVICE_B],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({
      data: {
        'device-a': { online: true, lastSeen: JUST_NOW },
        'device-b': { online: false, lastSeen: null },
      },
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

    renderWithProviders(<FleetContainer />)

    expect(
      screen.getByRole('link', { name: 'Greenhouse A' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Greenhouse B' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Offline' }))

    expect(screen.queryByRole('link', { name: 'Greenhouse A' })).toBeNull()
    expect(
      screen.getByRole('link', { name: 'Greenhouse B' }),
    ).toBeInTheDocument()
  })

  it('shows a "no matches" empty state when the filter narrows the rows to zero, keeping the filters visible', () => {
    useDevicesMock.mockReturnValue({
      data: [DEVICE_A],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({
      data: { 'device-a': { online: true, lastSeen: JUST_NOW } },
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

    renderWithProviders(<FleetContainer />)

    fireEvent.change(screen.getByLabelText('Search nodes'), {
      target: { value: 'no such node' },
    })

    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('No nodes match the filters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
  })
})
