import type { AuthSession } from '../features/auth/domain/authSession'

export interface Tenant {
  id: string
  name: string
}

/**
 * The system is single-tenant today (decision #411): every session maps to
 * exactly one `Tenant`, derived from the session's own id/email. This keeps
 * `TenantSwitcher` fed with real data even though the multi-tenant backend
 * change has not landed yet -- once it does, this is the one place that
 * needs to grow past a one-element array.
 */
export function deriveTenants(session: AuthSession): Tenant[] {
  return [{ id: session.userId, name: session.email ?? session.userId }]
}
