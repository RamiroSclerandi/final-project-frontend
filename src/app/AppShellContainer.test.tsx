import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../shared/test/renderWithProviders'
import { AppShellContainer } from './AppShellContainer'

const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('../features/auth', () => ({
  useAuth: useAuthMock,
  LogoutButtonContainer: () => <button type="button">Log out</button>,
}))

const AUTHENTICATED_SESSION = {
  userId: 'user-1',
  email: 'operator@example.com',
}

function renderShellAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="login" element={<p>Login page</p>} />
      <Route element={<AppShellContainer />}>
        <Route index element={<p>Route content</p>} />
        <Route path="alerts" element={<p>Alerts content</p>} />
      </Route>
    </Routes>,
    { route },
  )
}

describe('AppShellContainer', () => {
  it('derives a single tenant from the session and shows it as plain text (REQ-SHELL-4)', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    renderShellAt('/')

    expect(screen.getByText(AUTHENTICATED_SESSION.email)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('renders the routed child through the outlet', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    renderShellAt('/alerts')

    expect(screen.getByText('Alerts content')).toBeInTheDocument()
  })

  it('sends the user back to login when the session is missing, never a blank page', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })

    renderShellAt('/')

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Route content')).toBeNull()
  })
})
