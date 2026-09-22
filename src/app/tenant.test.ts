import { describe, expect, it } from 'vitest'

import { deriveTenants } from './tenant'

describe('deriveTenants', () => {
  it('derives exactly one tenant, named from the session email', () => {
    const tenants = deriveTenants({
      userId: 'user-1',
      email: 'operator@example.com',
    })

    expect(tenants).toEqual([{ id: 'user-1', name: 'operator@example.com' }])
  })

  it('falls back to the user id when the session has no email', () => {
    const tenants = deriveTenants({ userId: 'user-2', email: null })

    expect(tenants).toEqual([{ id: 'user-2', name: 'user-2' }])
  })
})
