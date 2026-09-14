import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { LatestReading } from '../domain/reading'
import { LatestReadingsGrid } from './LatestReadingsGrid'

const readingA: LatestReading = {
  sensorId: 'sensor-a',
  value: 1,
  timestamp: 't',
  quality: 'ok',
  channel: 'temperature',
  unit: 'degC',
  sensorLabel: null,
  deviceName: 'Node A',
}
const readingB: LatestReading = {
  ...readingA,
  sensorId: 'sensor-b',
  deviceName: 'Node B',
}

describe('LatestReadingsGrid', () => {
  it('shows a loading message while the initial fetch is pending', () => {
    render(
      <LatestReadingsGrid
        readings={[]}
        connectionStatus="connecting"
        isLoading={true}
      />,
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an empty message when no sensors are reporting yet', () => {
    render(
      <LatestReadingsGrid
        readings={[]}
        connectionStatus="live"
        isLoading={false}
      />,
    )

    expect(screen.getByText(/no sensors/i)).toBeInTheDocument()
  })

  it('renders one card per reading and the connection status', () => {
    render(
      <LatestReadingsGrid
        readings={[readingA, readingB]}
        connectionStatus="live"
        isLoading={false}
      />,
    )

    expect(screen.getByText('Node A')).toBeInTheDocument()
    expect(screen.getByText('Node B')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/live/i)
  })
})
