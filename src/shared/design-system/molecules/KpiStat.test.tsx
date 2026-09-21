import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KpiStat } from './KpiStat'

describe('KpiStat', () => {
  it('renders the label alongside its value', () => {
    render(<KpiStat label="Nodes" value={12} />)

    expect(screen.getByText('Nodes')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders a string value as-is', () => {
    render(<KpiStat label="Status" value="Live" />)

    expect(screen.getByText('Live')).toBeInTheDocument()
  })
})
