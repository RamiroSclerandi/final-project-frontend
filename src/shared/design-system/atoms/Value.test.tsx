import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test/renderWithProviders'
import { Value } from './Value'

// REQ-DT-4: the Value atom must render numeric content with `tabular-nums`.
// Asserting this one utility class is a deliberate exception to the general
// "never assert CSS classes" rule (strict-tdd.md) because the requirement
// itself is defined in terms of that exact class.
describe('Value', () => {
  it('renders the formatted number with the tabular-nums utility (REQ-DT-4)', () => {
    renderWithProviders(<Value value={12.5} unit="kWh" />)

    const value = screen.getByText('12.5 kWh')
    expect(value).toHaveClass('tabular-nums')
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
})
