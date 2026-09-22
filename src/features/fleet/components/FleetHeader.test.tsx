import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { FleetHeader } from './FleetHeader'

describe('FleetHeader', () => {
  it('shows the fleet KPI counts from the fixture summary (REQ-FLEET-1)', () => {
    renderWithProviders(
      <FleetHeader
        summary={{
          total: 12,
          online: 11,
          offline: 1,
          unknown: 0,
          qualityAlerts: 3,
        }}
        connectionStatus="live"
      />,
    )

    expect(screen.getByText('12 nodes')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('labels the data-quality KPI as a quality proxy, not bare "alerts" (REQ-FLEET-2)', () => {
    renderWithProviders(
      <FleetHeader
        summary={{
          total: 1,
          online: 1,
          offline: 0,
          unknown: 0,
          qualityAlerts: 1,
        }}
        connectionStatus="live"
      />,
    )

    expect(screen.getByText('Data-quality alerts')).toBeInTheDocument()
    expect(screen.queryByText(/^Alerts$/)).toBeNull()
  })

  it('renders the realtime connection status', () => {
    renderWithProviders(
      <FleetHeader
        summary={{
          total: 0,
          online: 0,
          offline: 0,
          unknown: 0,
          qualityAlerts: 0,
        }}
        connectionStatus="down"
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Disconnected')
  })
})
