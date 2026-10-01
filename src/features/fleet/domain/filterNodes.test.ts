import { describe, expect, it } from 'vitest'

import { filterNodes } from './filterNodes'
import type { FleetNode } from './fleetNode'

const ONLINE_CLEAN: FleetNode = {
  id: 'device-a',
  name: 'Greenhouse A',
  location: 'Row 1',
  transport: 'wifi-mqtt',
  status: 'online',
  lastActivity: '2026-09-22T10:00:00Z',
  hasQualityAlert: false,
  headline: null,
}

const OFFLINE_CLEAN: FleetNode = {
  id: 'device-b',
  name: 'Greenhouse B',
  location: 'Row 2',
  transport: 'lorawan',
  status: 'offline',
  lastActivity: null,
  hasQualityAlert: false,
  headline: null,
}

const ONLINE_WITH_ALERT: FleetNode = {
  id: 'device-c',
  name: 'Packing Shed',
  location: 'Lab Wing',
  transport: 'wifi-mqtt',
  status: 'online',
  lastActivity: '2026-09-22T10:05:00Z',
  hasQualityAlert: true,
  headline: null,
}

const NODES = [ONLINE_CLEAN, OFFLINE_CLEAN, ONLINE_WITH_ALERT]

describe('filterNodes', () => {
  it('returns every node for the "all" status filter', () => {
    expect(filterNodes(NODES, { status: 'all', search: '' })).toEqual(NODES)
  })

  it('narrows to online nodes only', () => {
    expect(filterNodes(NODES, { status: 'online', search: '' })).toEqual([
      ONLINE_CLEAN,
      ONLINE_WITH_ALERT,
    ])
  })

  it('narrows to offline nodes only', () => {
    expect(filterNodes(NODES, { status: 'offline', search: '' })).toEqual([
      OFFLINE_CLEAN,
    ])
  })

  it('narrows to nodes with a data-quality alert only', () => {
    expect(filterNodes(NODES, { status: 'alerts', search: '' })).toEqual([
      ONLINE_WITH_ALERT,
    ])
  })

  it('matches the node name case-insensitively', () => {
    expect(
      filterNodes(NODES, { status: 'all', search: 'GREENHOUSE a' }),
    ).toEqual([ONLINE_CLEAN])
  })

  it('matches the node location case-insensitively', () => {
    expect(filterNodes(NODES, { status: 'all', search: 'lab' })).toEqual([
      ONLINE_WITH_ALERT,
    ])
  })

  it('combines a status filter and a search term', () => {
    expect(
      filterNodes(NODES, { status: 'online', search: 'greenhouse' }),
    ).toEqual([ONLINE_CLEAN])
  })

  it('returns an empty array when nothing matches the search term', () => {
    expect(
      filterNodes(NODES, { status: 'all', search: 'nonexistent' }),
    ).toEqual([])
  })

  it('includes stale nodes in the offline filter', () => {
    const stale: FleetNode = { ...ONLINE_CLEAN, id: 'stale', status: 'stale' }

    expect(filterNodes([stale], { status: 'offline', search: '' })).toEqual([
      stale,
    ])
  })
})
