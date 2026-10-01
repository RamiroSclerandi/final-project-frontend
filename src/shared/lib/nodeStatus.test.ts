import { describe, expect, it } from 'vitest'

import {
  deriveNodeStatus,
  latestTimestamp,
  resolveNodeStatus,
} from './nodeStatus'

const NOW = Date.parse('2026-10-01T12:00:00Z')
const secondsAgo = (seconds: number) =>
  new Date(NOW - seconds * 1000).toISOString()

describe('deriveNodeStatus', () => {
  it('is unknown when the device has never reported a status', () => {
    expect(deriveNodeStatus(undefined, 10_000, NOW)).toBe('unknown')
  })

  it('is offline when the broker marked the device offline', () => {
    expect(
      deriveNodeStatus(
        { online: false, lastActivity: secondsAgo(1) },
        10_000,
        NOW,
      ),
    ).toBe('offline')
  })

  it('stays online while activity is within three sampling intervals', () => {
    expect(
      deriveNodeStatus(
        { online: true, lastActivity: secondsAgo(80) },
        30_000,
        NOW,
      ),
    ).toBe('online')
  })

  it('is stale once an online device is silent for over three sampling intervals', () => {
    expect(
      deriveNodeStatus(
        { online: true, lastActivity: secondsAgo(91) },
        30_000,
        NOW,
      ),
    ).toBe('stale')
  })

  it('never flags stale before one minute, whatever the sampling interval', () => {
    expect(
      deriveNodeStatus(
        { online: true, lastActivity: secondsAgo(59) },
        1_000,
        NOW,
      ),
    ).toBe('online')
  })

  it('stays online when there is no activity timestamp to judge by', () => {
    expect(
      deriveNodeStatus({ online: true, lastActivity: null }, 10_000, NOW),
    ).toBe('online')
  })
})

describe('latestTimestamp', () => {
  it('skips unparseable timestamps instead of letting them win', () => {
    expect(
      latestTimestamp(['not-a-date', secondsAgo(30), null, secondsAgo(90)]),
    ).toBe(secondsAgo(30))
  })
})

describe('resolveNodeStatus', () => {
  it('judges activity by the newest of last_seen and the readings', () => {
    expect(
      resolveNodeStatus(
        { online: true, lastSeen: secondsAgo(3600) },
        [secondsAgo(10)],
        10_000,
        NOW,
      ),
    ).toEqual({ status: 'online', lastActivity: secondsAgo(10) })
  })

  it('does not flag stale while the sampling interval is still unknown', () => {
    expect(
      resolveNodeStatus(
        { online: true, lastSeen: secondsAgo(3600) },
        [],
        null,
        NOW,
      ).status,
    ).toBe('online')
  })

  it('reports no activity for a device without a status row', () => {
    expect(resolveNodeStatus(undefined, [secondsAgo(10)], 10_000, NOW)).toEqual(
      { status: 'unknown', lastActivity: null },
    )
  })
})
