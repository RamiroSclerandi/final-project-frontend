import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { RequireSession } from './RequireSession'

const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('../features/auth', () => ({ useAuth: useAuthMock }))

function renderAtRoot() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/"
          element={
            <RequireSession>
              <p>Protected dashboard</p>
            </RequireSession>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireSession', () => {
  it('renders nothing while the auth status is loading', () => {
    useAuthMock.mockReturnValue({ status: 'loading' })

    renderAtRoot()

    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated' })

    renderAtRoot()

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument()
  })

  it('renders the protected children when authenticated', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated' })

    renderAtRoot()

    expect(screen.getByText('Protected dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})
