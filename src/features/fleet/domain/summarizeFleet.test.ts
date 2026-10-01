import { describe, expect, it } from 'vitest'

import { summarizeFleet } from './summarizeFleet'
import type { FleetNode } from './fleetNode'

function node(overrides: Partial<FleetNode>): FleetNode {
  return {
    id: 'node-1',
    name: 'Node 1',
    location: null,
    transport: 'wifi-mqtt',
    status: 'online',
    lastActivity: null,
    hasQualityAlert: false,
    headline: null,
    ...overrides,
  }
}

describe('summarizeFleet', () => {
  it('returns all-zero counts for an empty fleet', () => {
    expect(summarizeFleet([])).toEqual({
      total: 0,
      online: 0,
      offline: 0,
      unknown: 0,
      qualityAlerts: 0,
    })
  })

  it('counts status and quality-alert totals across a fixture fleet (REQ-FLEET-1)', () => {
    const nodes = [
      ...Array.from({ length: 11 }, (_, i) => node({ id: `online-${i}` })),
      node({ id: 'offline-1', status: 'offline' }),
    ].map((n, i) => (i < 3 ? { ...n, hasQualityAlert: true } : n))

    expect(summarizeFleet(nodes)).toEqual({
      total: 12,
      online: 11,
      offline: 1,
      unknown: 0,
      qualityAlerts: 3,
    })
  })

  it('counts a stale node as not online', () => {
    const summary = summarizeFleet([node({ id: 'stale-1', status: 'stale' })])

    expect(summary.online).toBe(0)
    expect(summary.offline).toBe(1)
  })
})
