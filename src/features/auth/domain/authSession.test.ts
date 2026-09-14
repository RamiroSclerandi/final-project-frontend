import { describe, expect, it } from 'vitest'

import { toAuthSession } from './authSession'

describe('toAuthSession', () => {
  it('returns null when there is no Supabase user', () => {
    expect(toAuthSession(null)).toBeNull()
  })

  it('maps a Supabase user to the domain AuthSession shape', () => {
    expect(
      toAuthSession({ id: 'user-1', email: 'operator@example.com' }),
    ).toEqual({ userId: 'user-1', email: 'operator@example.com' })
  })

  it('maps a missing email to null rather than undefined', () => {
    expect(toAuthSession({ id: 'user-1', email: undefined })).toEqual({
      userId: 'user-1',
      email: null,
    })
  })
})
