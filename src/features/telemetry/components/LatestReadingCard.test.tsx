import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { LatestReading } from '../domain/reading'
import { LatestReadingCard } from './LatestReadingCard'

const reading: LatestReading = {
  sensorId: 'sensor-a',
  value: 21.4,
  timestamp: '2026-09-14T11:00:00Z',
  quality: 'ok',
  channel: 'temperature',
  unit: 'degC',
  sensorLabel: 'Greenhouse',
  deviceName: 'Node A',
}

function renderCard(props: Partial<LatestReading> = {}) {
  return render(
    <MemoryRouter>
      <LatestReadingCard reading={{ ...reading, ...props }} />
    </MemoryRouter>,
  )
}

describe('LatestReadingCard', () => {
  it('renders the device name, value, unit, and sensor label', () => {
    renderCard()

    expect(screen.getByText('Node A')).toBeInTheDocument()
    expect(screen.getByText(/21.4/)).toBeInTheDocument()
    expect(screen.getByText('degC')).toBeInTheDocument()
    expect(screen.getByText('Greenhouse')).toBeInTheDocument()
  })

  it('falls back to the channel name when there is no sensor label', () => {
    renderCard({ sensorLabel: null })

    expect(screen.getByText('temperature')).toBeInTheDocument()
  })

  it('shows a quality warning for an out-of-range reading', () => {
    renderCard({ quality: 'out_of_range' })

    expect(screen.getByRole('status')).toHaveTextContent(/out of range/i)
  })

  it('shows no quality warning for an ok reading', () => {
    renderCard()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('links to the sensor history page', () => {
    renderCard()

    expect(screen.getByRole('link', { name: /view history/i })).toHaveAttribute(
      'href',
      '/history/sensor-a',
    )
  })
})
