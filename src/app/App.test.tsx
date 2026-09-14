import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'

const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('../features/auth/application/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../features/auth/application/useAuth', () => ({
  useAuth: useAuthMock,
}))

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('redirects an unauthenticated visitor away from the dashboard route to login', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated', signIn: vi.fn() })

    renderAppAt('/')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the dashboard placeholder with a logout action for an authenticated visitor', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated', signOut: vi.fn() })

    renderAppAt('/')

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('renders the login form at /login', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated', signIn: vi.fn() })

    renderAppAt('/login')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
})
