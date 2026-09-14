import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginContainer } from './LoginContainer'

const navigateMock = vi.hoisted(() => vi.fn())
const signInMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../application/useAuth', () => ({
  useAuth: () => ({ signIn: signInMock }),
}))

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: email },
  })
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: password },
  })
  fireEvent.click(screen.getByRole('button', { name: /log in/i }))
}

describe('LoginContainer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('navigates to the dashboard route on successful sign-in', async () => {
    signInMock.mockResolvedValue({ error: null })
    render(<LoginContainer />)

    fillAndSubmit('operator@example.com', 'right-password')

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true }),
    )
    expect(signInMock).toHaveBeenCalledWith(
      'operator@example.com',
      'right-password',
    )
  })

  it('shows the generic error and does not navigate on rejected sign-in', async () => {
    signInMock.mockResolvedValue({ error: 'Invalid email or password.' })
    render(<LoginContainer />)

    fillAndSubmit('operator@example.com', 'wrong-password')

    await waitFor(() =>
      expect(
        screen.getByText('Invalid email or password.'),
      ).toBeInTheDocument(),
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
