import type { AuthError, Session } from '@supabase/supabase-js'

import { supabase } from '../../../shared/api/supabase'

/**
 * Signs in with email and password only. There is no signup counterpart in
 * this module by design — self-registration is closed at the backend
 * (`enable_signup = false`) and this app exposes no path to it (REQ-AUTH-1).
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/**
 * Subscribes to Supabase auth state changes, including the initial
 * `INITIAL_SESSION` event fired once on subscribe — the mechanism that
 * restores a persisted session after a reload (REQ-AUTH-2).
 */
export function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return subscription
}
