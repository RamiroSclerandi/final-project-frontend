import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SignalBars } from './SignalBars'

describe('SignalBars', () => {
  it('pairs the signal text with a decorative glyph at full strength', () => {
    render(<SignalBars bars={4} label="Strong signal" />)

    expect(screen.getByText('Strong signal')).toBeInTheDocument()
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  // D12: rssi === null -> rssiToBars returns 0 -> the "unknown" variant,
  // which must still carry visible text, never a bare empty glyph.
  it('renders the unknown variant with visible text when bars is 0', () => {
    render(<SignalBars bars={0} label="Unknown" />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
