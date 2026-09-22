import { describe, expect, it } from 'vitest'

import { deriveNodeStatus } from './deriveNodeStatus'

describe('deriveNodeStatus', () => {
  it('returns online for a status row with online=true', () => {
    expect(deriveNodeStatus({ online: true, lastSeen: null })).toBe('online')
  })

  it('returns offline for a status row with online=false', () => {
    expect(deriveNodeStatus({ online: false, lastSeen: null })).toBe('offline')
  })

  it('returns unknown when no status row exists yet', () => {
    expect(deriveNodeStatus(undefined)).toBe('unknown')
  })
})
