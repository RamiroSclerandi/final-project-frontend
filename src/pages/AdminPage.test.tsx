import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../shared/test/renderWithProviders'
import { AdminPage } from './AdminPage'

const useDevicesMock = vi.hoisted(() => vi.fn())
const useDeviceStatusesMock = vi.hoisted(() => vi.fn())

vi.mock('../features/device-management', () => ({
  useDevices: useDevicesMock,
}))
vi.mock('../features/node-health', () => ({
  useDeviceStatuses: useDeviceStatusesMock,
}))

function mockUnassignedDevice() {
  useDevicesMock.mockReturnValue({
    data: [
      {
        id: 'device-a',
        name: 'Spare sensor node',
        macAddress: 'AABBCCDDEE01',
        transport: 'wifi-mqtt',
        provisioned: false,
        ownerId: null,
      },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  })
  useDeviceStatusesMock.mockReturnValue({ data: {}, isError: false })
}

describe('AdminPage', () => {
  it('renders three tabs: Unassigned devices, Clients, Users (REQ-ADMIN-2)', () => {
    mockUnassignedDevice()

    renderWithProviders(<AdminPage />)

    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('shows the Clients placeholder and issues no additional device query when selected (REQ-ADMIN-2)', () => {
    mockUnassignedDevice()
    renderWithProviders(<AdminPage />)
    const callsAfterMount = useDevicesMock.mock.calls.length

    fireEvent.click(screen.getByRole('tab', { name: 'Clients' }))

    expect(
      screen.getByText('Client management is not available yet.'),
    ).toBeInTheDocument()
    expect(useDevicesMock.mock.calls.length).toBe(callsAfterMount)
  })

  // Every other route names itself with exactly one level-1 heading. A tab
  // panel is a section of this page, so a placeholder inside one must not
  // introduce a second h1 -- the page keeps its own regardless of selection.
  it('names the page with a single level-1 heading on every tab', () => {
    mockUnassignedDevice()
    renderWithProviders(<AdminPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Admin')

    fireEvent.click(screen.getByRole('tab', { name: 'Clients' }))

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  // REQ-ADMIN-3: Tabs already implements roving-tabindex arrow-key
  // navigation (PR-2, Tabs.test.tsx) -- this exercises it at the page level
  // instead of reimplementing the keyboard contract.
  it('moves the tab selection to the next tab on ArrowRight', () => {
    mockUnassignedDevice()
    renderWithProviders(<AdminPage />)

    screen.getByRole('tab', { name: 'Unassigned devices' }).focus()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })

    expect(screen.getByRole('tab', { name: 'Clients' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
