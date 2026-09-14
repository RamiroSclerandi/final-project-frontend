/**
 * The app's own shape for an authenticated session, independent of the
 * Supabase SDK's `Session` type. Only `infrastructure/authClient.ts` calls
 * into this mapping, so domain still carries zero Supabase import (D-1).
 */
export interface AuthSession {
  userId: string
  email: string | null
}

interface SupabaseUserLike {
  id: string
  email?: string | null
}

/**
 * Maps a Supabase user object to the domain `AuthSession` shape. Takes a
 * structurally-typed input instead of the SDK's `User` type, so this module
 * needs no `@supabase/supabase-js` import at all.
 */
export function toAuthSession(
  user: SupabaseUserLike | null,
): AuthSession | null {
  if (!user) {
    return null
  }
  return { userId: user.id, email: user.email ?? null }
}
