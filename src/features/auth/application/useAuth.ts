import { useContext } from 'react'

import { AuthContext } from './AuthContext'

/**
 * Reads the current auth status, session, and sign-in/sign-out actions.
 * Must be called under `AuthProvider`.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
