import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { NodeHeader } from './NodeHeader'

const BASE_PROPS = {
  name: 'Greenhouse A',
  location: 'Row 1',
  status: 'online' as const,
  lastSeen: '2026-09-22T10:05:00Z',
  firmwareVersion: '1.2.0',
  transport: 'wifi-mqtt',
  rssi: -65,
  onOpenConfig: vi.fn(),
}

describe('NodeHeader', () => {
  // The drawer lands in a later PR. Until it does, the button has to look as
  // dead as it is: an enabled control that swallows the click tells the user
  // the app is broken.
  it('disables the configure button while no handler is wired', () => {
    renderWithProviders(<NodeHeader {...BASE_PROPS} onOpenConfig={undefined} />)

    expect(screen.getByRole('button', { name: 'Configure' })).toBeDisabled()
  })

  it('enables the configure button once a handler is given', () => {
    renderWithProviders(<NodeHeader {...BASE_PROPS} />)

    expect(screen.getByRole('button', { name: 'Configure' })).toBeEnabled()
  })

  it('pairs the online status with an aria-hidden decorative glyph (REQ-NODE-1, REQ-NODE-4)', () => {
    renderWithProviders(<NodeHeader {...BASE_PROPS} />)

    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('renders a labelled "Not available" when firmwareVersion is null (REQ-NODE-1)', () => {
    renderWithProviders(<NodeHeader {...BASE_PROPS} firmwareVersion={null} />)

    expect(screen.getByText('Firmware: Not available')).toBeInTheDocument()
  })

  // Debt fix: firmware and last-seen used to both fall back to a bare,
  // unlabelled "Not available" -- indistinguishable from each other, unlike
  // signal and transport which always carry a label.
  it('labels firmware and last-seen separately when both are missing', () => {
    renderWithProviders(
      <NodeHeader {...BASE_PROPS} firmwareVersion={null} lastSeen={null} />,
    )

    expect(screen.getByText('Firmware: Not available')).toBeInTheDocument()
    expect(screen.getByText('Last seen: Not available')).toBeInTheDocument()
  })

  it('renders the transport value', () => {
    renderWithProviders(<NodeHeader {...BASE_PROPS} transport="lorawan" />)

    expect(screen.getByText(/lorawan/)).toBeInTheDocument()
  })

  it('renders the last-seen time as a semantic <time> element carrying the raw ISO timestamp', () => {
    renderWithProviders(<NodeHeader {...BASE_PROPS} />)

    const time = document.querySelector('time')
    expect(time).not.toBeNull()
    expect(time).toHaveAttribute('datetime', BASE_PROPS.lastSeen)
  })

  it('renders the unknown signal variant with visible text when rssi is null (D12)', () => {
    renderWithProviders(<NodeHeader {...BASE_PROPS} rssi={null} />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
