import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { FleetTable, type FleetRow } from './FleetTable'

const onlineRow: FleetRow = {
  id: 'device-a',
  name: 'Greenhouse A',
  location: 'Row 1',
  transport: 'wifi-mqtt',
  status: 'online',
  lastActivity: '2026-09-22T10:05:00Z',
  hasQualityAlert: true,
  headline: {
    sensorId: 'sensor-a1',
    channel: 'voltage',
    unit: 'V',
    value: 220,
  },
  sparkline: null,
}

const offlineRow: FleetRow = {
  id: 'device-b',
  name: 'Greenhouse B',
  location: null,
  transport: 'lorawan',
  status: 'offline',
  lastActivity: null,
  hasQualityAlert: false,
  headline: null,
  sparkline: null,
}

describe('FleetTable', () => {
  it('renders a real table with a scoped column header per field (REQ-FLEET-3)', () => {
    renderWithProviders(<FleetTable rows={[onlineRow]} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(6)
    for (const header of headers) {
      expect(header).toHaveAttribute('scope', 'col')
    }
  })

  // REQ-FLEET-2: this column reports per-node data quality, not the alerting
  // feature that /alerts reserves, so its header must not read as "Alerts".
  it('heads the quality column by data quality rather than alerts', () => {
    renderWithProviders(<FleetTable rows={[onlineRow]} />)

    expect(
      screen.getByRole('columnheader', { name: 'Data quality' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /^Alerts$/ })).toBeNull()
  })

  it('gives every data cell a data-label matching its column (REQ-MOBILE-3)', () => {
    renderWithProviders(<FleetTable rows={[onlineRow]} />)

    const [, row] = screen.getAllByRole('row')
    const cells = within(row as HTMLElement).getAllByRole('cell')
    expect(cells).toHaveLength(6)
    for (const cell of cells) {
      expect(cell.getAttribute('data-label')).toBeTruthy()
    }
  })

  it('links the node name to its detail route and shows its headline value', () => {
    renderWithProviders(<FleetTable rows={[onlineRow]} />)

    expect(screen.getByRole('link', { name: 'Greenhouse A' })).toHaveAttribute(
      'href',
      '/nodes/device-a',
    )
    expect(screen.getByText('220 V')).toBeInTheDocument()
  })

  it('falls back to "Not available" for a node with no location, headline, or last-seen data', () => {
    renderWithProviders(<FleetTable rows={[offlineRow]} />)

    expect(screen.getAllByText('Not available')).toHaveLength(3)
  })

  it('marks a row with a data-quality alert, and leaves a clean row unmarked', () => {
    renderWithProviders(<FleetTable rows={[onlineRow, offlineRow]} />)

    expect(screen.getByText('Data-quality alerts')).toBeInTheDocument()
    const [, alertingRow, cleanRow] = screen.getAllByRole('row')
    expect(
      within(alertingRow as HTMLElement).getByText('Data-quality alerts'),
    ).toBeInTheDocument()
    expect(
      within(cleanRow as HTMLElement).queryByText('Data-quality alerts'),
    ).toBeNull()
  })
})
