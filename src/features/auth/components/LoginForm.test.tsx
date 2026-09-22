import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('renders email and password fields with a submit button and no signup link', () => {
    renderWithProviders(
      <LoginForm onSubmit={vi.fn()} isSubmitting={false} errorMessage={null} />,
    )

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.queryByText(/sign\s*up/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('calls onSubmit with the entered email and password', () => {
    const onSubmit = vi.fn()

    renderWithProviders(
      <LoginForm
        onSubmit={onSubmit}
        isSubmitting={false}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'operator@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'super-secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      'operator@example.com',
      'super-secret',
    )
  })

  it('shows the given error message', () => {
    renderWithProviders(
      <LoginForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        errorMessage="Invalid email or password."
      />,
    )

    expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
  })

  it('disables the submit button while submitting', () => {
    renderWithProviders(
      <LoginForm onSubmit={vi.fn()} isSubmitting={true} errorMessage={null} />,
    )

    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled()
  })

  it('shows translated field labels in Spanish', () => {
    renderWithProviders(
      <LoginForm onSubmit={vi.fn()} isSubmitting={false} errorMessage={null} />,
      { locale: 'es' },
    )

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
  })
})
