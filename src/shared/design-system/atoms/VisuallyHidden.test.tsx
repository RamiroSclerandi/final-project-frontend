import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { VisuallyHidden } from './VisuallyHidden'

describe('VisuallyHidden', () => {
  it('keeps its children in the accessibility tree', () => {
    render(<VisuallyHidden>Toggle theme</VisuallyHidden>)

    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
  })

  it('renders different children', () => {
    render(<VisuallyHidden>Dismiss</VisuallyHidden>)

    expect(screen.getByText('Dismiss')).toBeInTheDocument()
  })
})
