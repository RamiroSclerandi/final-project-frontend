import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test/renderWithProviders'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('exposes an accessible name and reflects the active theme via aria-pressed', () => {
    renderWithProviders(<ThemeToggle theme="dark" onToggle={() => {}} />)

    const button = screen.getByRole('button', { name: 'Toggle theme' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks aria-pressed true once the light theme is active', () => {
    renderWithProviders(<ThemeToggle theme="light" onToggle={() => {}} />)

    expect(
      screen.getByRole('button', { name: 'Toggle theme' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('runs the onToggle callback on click', () => {
    let toggled = false
    renderWithProviders(
      <ThemeToggle theme="dark" onToggle={() => (toggled = true)} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))

    expect(toggled).toBe(true)
  })
})
