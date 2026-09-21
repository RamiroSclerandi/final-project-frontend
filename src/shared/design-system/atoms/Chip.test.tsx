import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Chip } from './Chip'

describe('Chip', () => {
  it('renders its children', () => {
    render(<Chip>RS-485</Chip>)

    expect(screen.getByText('RS-485')).toBeInTheDocument()
  })

  it('renders different children on re-render', () => {
    const { rerender } = render(<Chip>MQTT</Chip>)
    expect(screen.getByText('MQTT')).toBeInTheDocument()

    rerender(<Chip>LoRaWAN</Chip>)
    expect(screen.getByText('LoRaWAN')).toBeInTheDocument()
  })
})
