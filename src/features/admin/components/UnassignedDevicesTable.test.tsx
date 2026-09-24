import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import {
  UnassignedDevicesTable,
  type UnassignedDeviceRow,
} from './UnassignedDevicesTable'

const LAST_SEEN_ISO = '2026-09-24T10:00:00.000Z'

const DEVICE: UnassignedDeviceRow = {
  id: 'device-x',
  name: 'Spare sensor node',
  macAddress: 'AABBCCDDEEFF',
  transport: 'wifi-mqtt',
  provisioned: false,
  lastSeen: LAST_SEEN_ISO,
}

describe('UnassignedDevicesTable', () => {
  it('stacks on narrow viewports via the shared table-stack class (REQ-MOBILE-3)', () => {
    renderWithProviders(<UnassignedDevicesTable devices={[DEVICE]} />)

    expect(screen.getByRole('table')).toHaveClass('table-stack')
  })

  it('gives every data cell a data-label matching its column (REQ-MOBILE-3)', () => {
    renderWithProviders(<UnassignedDevicesTable devices={[DEVICE]} />)

    const [, row] = screen.getAllByRole('row')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    expect(cells).toHaveLength(5)
    for (const cell of cells) {
      expect(cell.getAttribute('data-label')).toBeTruthy()
    }
  })

  // Recency is the triage signal for this screen: it is what separates a node
  // that reported minutes ago from one abandoned months ago. Assert the
  // machine-readable timestamp rather than the formatted label, which moves
  // with the clock and the locale.
  it('exposes when the device last reported as a semantic timestamp', () => {
    renderWithProviders(<UnassignedDevicesTable devices={[DEVICE]} />)

    const [, row] = screen.getAllByRole('row')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    expect(cells[4]?.querySelector('time')).toHaveAttribute(
      'dateTime',
      LAST_SEEN_ISO,
    )
  })

  it('falls back to "not available" for a device that has never reported', () => {
    renderWithProviders(
      <UnassignedDevicesTable devices={[{ ...DEVICE, lastSeen: null }]} />,
    )

    const [, row] = screen.getAllByRole('row')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    expect(cells[4]).toHaveTextContent('Not available')
  })

  it('never declares a fixed-pixel width class on the table root', () => {
    renderWithProviders(<UnassignedDevicesTable devices={[DEVICE]} />)

    expect(screen.getByRole('table').className).not.toMatch(/w-\[\d+px\]/)
  })

  it('renders the device MAC address and name as real data', () => {
    renderWithProviders(<UnassignedDevicesTable devices={[DEVICE]} />)

    expect(screen.getByText('AABBCCDDEEFF')).toBeInTheDocument()
    expect(screen.getByText('Spare sensor node')).toBeInTheDocument()
  })
})
