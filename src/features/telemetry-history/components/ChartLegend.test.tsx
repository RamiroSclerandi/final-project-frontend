import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { ChartLegend } from './ChartLegend'

describe('ChartLegend', () => {
  it('renders three quality marks with distinct data-quality attributes and text labels (REQ-SENSOR-3)', () => {
    renderWithProviders(<ChartLegend />)

    expect(screen.getByText('Out of range')).toBeInTheDocument()
    expect(screen.getByText('Suspect')).toBeInTheDocument()
    expect(screen.getByText('Provisional')).toBeInTheDocument()

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.dataset.quality)).toEqual([
      'out_of_range',
      'suspect',
      'provisional',
    ])
  })
})
