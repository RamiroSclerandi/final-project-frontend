import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusDot } from './StatusDot'

describe('StatusDot', () => {
  it('pairs the status text with a decorative glyph (REQ-NODE-4)', () => {
    render(<StatusDot status="online" label="Online" />)

    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('renders the label passed in for a different status value', () => {
    const { rerender } = render(<StatusDot status="offline" label="Offline" />)
    expect(screen.getByText('Offline')).toBeInTheDocument()

    rerender(<StatusDot status="unknown" label="Unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
