import { describe, expect, it } from 'vitest'

import { filterUnassignedDevices } from './filterUnassignedDevices'

describe('filterUnassignedDevices', () => {
  it('keeps only devices without an owner (REQ-ADMIN-1)', () => {
    expect(
      filterUnassignedDevices([{ ownerId: 'u1' }, { ownerId: null }]),
    ).toHaveLength(1)
  })

  it('returns the ownerless device itself, not just a count', () => {
    const owned = { id: 'device-a', ownerId: 'user-1' }
    const unassigned = { id: 'device-b', ownerId: null }

    expect(filterUnassignedDevices([owned, unassigned])).toEqual([unassigned])
  })

  it('returns an empty array when every device already has an owner', () => {
    expect(
      filterUnassignedDevices([
        { id: 'device-a', ownerId: 'user-1' },
        { id: 'device-b', ownerId: 'user-2' },
      ]),
    ).toEqual([])
  })

  // `fetchDevices` casts the PostgREST payload instead of validating it, so a
  // column the query stops returning arrives as `undefined`. Classifying that
  // as owned would tell the operator every device is assigned -- a false
  // all-clear is worse than an over-long list.
  it('treats a missing ownerId as unassigned rather than owned', () => {
    const missing = { id: 'device-a' } as unknown as { ownerId: string | null }

    expect(filterUnassignedDevices([missing])).toEqual([missing])
  })
})
