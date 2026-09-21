import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QualityMark } from './QualityMark'

describe('QualityMark', () => {
  it('pairs the quality text with a decorative glyph', () => {
    render(<QualityMark quality="ok" label="OK" />)

    expect(screen.getByText('OK')).toBeInTheDocument()
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('renders the label passed in for a different quality value', () => {
    const { rerender } = render(
      <QualityMark quality="out_of_range" label="Out of range" />,
    )
    expect(screen.getByText('Out of range')).toBeInTheDocument()

    rerender(<QualityMark quality="provisional" label="Provisional" />)
    expect(screen.getByText('Provisional')).toBeInTheDocument()
  })
})
