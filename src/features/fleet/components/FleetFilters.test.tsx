import { fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { filterNodes } from '../domain/filterNodes'
import type { FleetNode } from '../domain/fleetNode'
import { FleetFilters, type FleetFilterValue } from './FleetFilters'

const ONLINE_NODE: FleetNode = {
  id: 'device-a',
  name: 'Greenhouse A',
  location: 'Row 1',
  transport: 'wifi-mqtt',
  status: 'online',
  lastSeen: null,
  hasQualityAlert: false,
  headline: null,
}

const OFFLINE_NODE: FleetNode = {
  id: 'device-b',
  name: 'Greenhouse B',
  location: 'Row 2',
  transport: 'lorawan',
  status: 'offline',
  lastSeen: null,
  hasQualityAlert: false,
  headline: null,
}

/** Wires `FleetFilters` to real `filterNodes` so the assertions prove the
 * chip/search controls actually narrow visible nodes, not just that a
 * callback fired. */
function FilteredNodeList({ nodes }: { nodes: FleetNode[] }) {
  const [value, setValue] = useState<FleetFilterValue>({
    status: 'all',
    search: '',
  })
  const visible = filterNodes(nodes, value)

  return (
    <>
      <FleetFilters value={value} onChange={setValue} />
      <ul>
        {visible.map((node) => (
          <li key={node.id}>{node.name}</li>
        ))}
      </ul>
    </>
  )
}

describe('FleetFilters', () => {
  it('narrows the visible nodes to offline only once the Offline chip is selected', () => {
    renderWithProviders(
      <FilteredNodeList nodes={[ONLINE_NODE, OFFLINE_NODE]} />,
    )

    expect(screen.getByText('Greenhouse A')).toBeInTheDocument()
    expect(screen.getByText('Greenhouse B')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Offline' }))

    expect(screen.queryByText('Greenhouse A')).toBeNull()
    expect(screen.getByText('Greenhouse B')).toBeInTheDocument()
  })

  it('marks the active status chip as pressed and the rest as not pressed', () => {
    renderWithProviders(
      <FleetFilters
        value={{ status: 'online', search: '' }}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Online' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('narrows the visible nodes by a case-insensitive search term', () => {
    renderWithProviders(
      <FilteredNodeList nodes={[ONLINE_NODE, OFFLINE_NODE]} />,
    )

    fireEvent.change(screen.getByLabelText('Search nodes'), {
      target: { value: 'GREENHOUSE a' },
    })

    expect(screen.getByText('Greenhouse A')).toBeInTheDocument()
    expect(screen.queryByText('Greenhouse B')).toBeNull()
  })
})
