import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test/renderWithProviders'
import { LocaleToggle } from './LocaleToggle'

describe('LocaleToggle', () => {
  it('exposes an accessible name and marks the active locale pressed, each option carrying its own lang (REQ-I18N-5)', () => {
    renderWithProviders(<LocaleToggle locale="en" onChange={() => {}} />)

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()

    const english = screen.getByRole('button', { name: 'English' })
    const spanish = screen.getByRole('button', { name: 'Español' })
    expect(english).toHaveAttribute('aria-pressed', 'true')
    expect(english).toHaveAttribute('lang', 'en')
    expect(spanish).toHaveAttribute('aria-pressed', 'false')
    expect(spanish).toHaveAttribute('lang', 'es')
  })

  it('reports the clicked locale back to the caller', () => {
    let selected: string | null = null
    renderWithProviders(
      <LocaleToggle locale="en" onChange={(locale) => (selected = locale)} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Español' }))

    expect(selected).toBe('es')
  })
})
