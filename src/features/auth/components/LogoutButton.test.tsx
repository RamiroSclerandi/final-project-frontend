import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { LogoutButton } from './LogoutButton'

describe('LogoutButton', () => {
  it('calls onLogout when clicked', () => {
    const onLogout = vi.fn()

    renderWithProviders(<LogoutButton onLogout={onLogout} />)
    fireEvent.click(screen.getByRole('button', { name: /log out/i }))

    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('shows the translated label in Spanish', () => {
    renderWithProviders(<LogoutButton onLogout={vi.fn()} />, {
      locale: 'es',
    })

    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeInTheDocument()
  })
})
