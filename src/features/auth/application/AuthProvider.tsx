import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { toAuthSession } from '../domain/authSession'
import { toSafeLoginErrorMessage } from '../domain/loginError'
import {
  signInWithPassword,
  signOut as requestSignOut,
  subscribeToAuthChanges,
} from '../infrastructure/authClient'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from './AuthContext'

interface AuthState {
  status: AuthStatus
  session: AuthContextValue['session']
}

/**
 * Owns the auth session for the whole app. Subscribes once to Supabase auth
 * changes — including the initial `INITIAL_SESSION` event that restores a
 * persisted session after a reload (REQ-AUTH-2) — and exposes `signIn` /
 * `signOut` through `useAuth`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
  })

  useEffect(() => {
    const subscription = subscribeToAuthChanges((session) => {
      setState({
        status: session ? 'authenticated' : 'unauthenticated',
        session: toAuthSession(session?.user ?? null),
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await signInWithPassword(email, password)
    return { error: error ? toSafeLoginErrorMessage(error) : null }
  }, [])

  const signOut = useCallback(() => requestSignOut(), [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
