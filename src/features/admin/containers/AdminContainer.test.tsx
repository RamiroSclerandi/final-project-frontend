import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { AdminContainer } from './AdminContainer'

const useDevicesMock = vi.hoisted(() => vi.fn())
const useDeviceStatusesMock = vi.hoisted(() => vi.fn())

vi.mock('../../device-management', () => ({ useDevices: useDevicesMock }))
vi.mock('../../node-health', () => ({
  useDeviceStatuses: useDeviceStatusesMock,
}))

const LAST_SEEN_ISO = '2026-09-24T10:00:00.000Z'

beforeEach(() => {
  useDeviceStatusesMock.mockReturnValue({ data: {}, isError: false })
})

const OWNED_DEVICE = {
  id: 'device-a',
  name: 'Greenhouse A',
  macAddress: 'AABBCCDDEE01',
  transport: 'wifi-mqtt',
  provisioned: true,
  ownerId: 'user-1',
}

const UNASSIGNED_DEVICE = {
  id: 'device-b',
  name: 'Spare sensor node',
  macAddress: 'AABBCCDDEE02',
  transport: 'lorawan',
  provisioned: false,
  ownerId: null,
}

describe('AdminContainer', () => {
  it('shows no table while devices are pending', () => {
    useDevicesMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<AdminContainer />)

    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows a retry action when the devices query fails', () => {
    const refetch = vi.fn()
    useDevicesMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    })

    renderWithProviders(<AdminContainer />)

    expect(
      screen.getByText('Unassigned devices unavailable'),
    ).toBeInTheDocument()
    screen.getByRole('button', { name: 'Retry' }).click()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows an "every device is assigned" empty state when no device is ownerless', () => {
    useDevicesMock.mockReturnValue({
      data: [OWNED_DEVICE],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<AdminContainer />)

    expect(screen.getByText('Every device is assigned')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('renders only the ownerless device as a row, out of a mixed fleet (REQ-ADMIN-1)', () => {
    useDevicesMock.mockReturnValue({
      data: [OWNED_DEVICE, UNASSIGNED_DEVICE],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<AdminContainer />)

    // header row + exactly one ownerless device row
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('Spare sensor node')).toBeInTheDocument()
    expect(screen.queryByText('Greenhouse A')).toBeNull()
  })

  it('joins each unassigned device to when it last reported', () => {
    useDevicesMock.mockReturnValue({
      data: [UNASSIGNED_DEVICE],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({
      data: {
        'device-b': {
          deviceId: 'device-b',
          name: 'Spare sensor node',
          online: false,
          lastSeen: LAST_SEEN_ISO,
        },
      },
      isError: false,
    })

    renderWithProviders(<AdminContainer />)

    const [, row] = screen.getAllByRole('row')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    expect(cells[4]?.querySelector('time')).toHaveAttribute(
      'dateTime',
      LAST_SEEN_ISO,
    )
  })

  // Recency is supplementary here -- the device list is the point of the
  // screen, so a failed status query degrades one column instead of hiding
  // every ownerless device behind an error state.
  it('still lists ownerless devices when the status query fails', () => {
    useDevicesMock.mockReturnValue({
      data: [UNASSIGNED_DEVICE],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    useDeviceStatusesMock.mockReturnValue({ data: undefined, isError: true })

    renderWithProviders(<AdminContainer />)

    expect(screen.getByText('Spare sensor node')).toBeInTheDocument()
    const [, row] = screen.getAllByRole('row')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    expect(cells[4]).toHaveTextContent('Not available')
  })
})
