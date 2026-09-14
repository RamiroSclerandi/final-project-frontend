import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth'

/**
 * Router guard (REQ-AUTH-2): redirects unauthenticated visitors to `/login`
 * before any protected route renders. Renders nothing while the initial
 * auth status is still resolving, so a protected route never flashes before
 * the redirect.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return null
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
