import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('renders an accessible svg image with a polyline built from the values', () => {
    render(<Sparkline values={[1, 2, 3]} label="Last 60 minutes" />)

    const image = screen.getByRole('img', { name: 'Last 60 minutes' })
    const polyline = image.querySelector('polyline')
    expect(polyline).not.toBeNull()
    expect(polyline).toHaveAttribute(
      'points',
      '0.00,24.00 50.00,12.00 100.00,0.00',
    )
  })

  it('renders a different accessible name for a different label', () => {
    render(<Sparkline values={[4, 1]} label="Voltage trend" />)

    expect(
      screen.getByRole('img', { name: 'Voltage trend' }),
    ).toBeInTheDocument()
  })
})
