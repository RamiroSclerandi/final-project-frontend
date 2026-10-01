import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test/renderWithProviders'
import { Value } from './Value'

describe('Value', () => {
  it('renders the formatted number with its unit', () => {
    renderWithProviders(<Value value={12.5} unit="kWh" />)

    expect(screen.getByText('12.5 kWh')).toBeInTheDocument()
  })

  it('formats the same number using the active locale separators', () => {
    renderWithProviders(<Value value={12.5} unit="kWh" />, { locale: 'es' })

    expect(screen.getByText('12,5 kWh')).toBeInTheDocument()
  })

  // PR-2 debt: an empty/absent unit (a unitless magnitude, e.g. power factor) was never asserted.
  it('renders only the formatted number when unit is an empty string', () => {
    renderWithProviders(<Value value={0.95} unit="" />)

    expect(screen.getByText('0.95')).toBeInTheDocument()
  })

  it('shows the display symbol for a stored unit code', () => {
    renderWithProviders(<Value value={21.5} unit="degC" />)

    expect(screen.getByText('21.5 °C')).toBeInTheDocument()
  })
})
