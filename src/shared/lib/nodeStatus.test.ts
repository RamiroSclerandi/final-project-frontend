import { describe, expect, it } from 'vitest'

import {
  deriveNodeStatus,
  latestTimestamp,
  pickStaleAfterMs,
  resolveNodeStatus,
} from './nodeStatus'

const NOW = Date.parse('2026-10-01T12:00:00Z')
const secondsAgo = (seconds: number) =>
  new Date(NOW - seconds * 1000).toISOString()

describe('pickStaleAfterMs', () => {
  it('is three sampling intervals for a configured device', () => {
    expect(pickStaleAfterMs({ 'device-a': 60_000 }, 'device-a')).toBe(180_000)
  })

  it('never goes below two minutes, whatever the sampling interval', () => {
    expect(pickStaleAfterMs({ 'device-a': 1_000 }, 'device-a')).toBe(120_000)
  })

  it('is five minutes for a device without a config row', () => {
    expect(pickStaleAfterMs({}, 'device-a')).toBe(300_000)
  })

  it('is unknown while configs have not loaded', () => {
    expect(pickStaleAfterMs(null, 'device-a')).toBeNull()
  })
})

describe('deriveNodeStatus', () => {
  it('is unknown when the device has never reported a status', () => {
    expect(deriveNodeStatus(undefined, 180_000, NOW)).toBe('unknown')
  })

  it('is offline when the broker marked the device offline', () => {
    expect(
      deriveNodeStatus(
        { online: false, lastActivity: secondsAgo(1) },
        180_000,
        NOW,
      ),
    ).toBe('offline')
  })

  it('stays online at exactly the stale window', () => {
    expect(
      deriveNodeStatus(
        { online: true, lastActivity: secondsAgo(300) },
        300_000,
        NOW,
      ),
    ).toBe('online')
  })

  it('is stale one second past the stale window', () => {
    expect(
      deriveNodeStatus(
        { online: true, lastActivity: secondsAgo(301) },
        300_000,
        NOW,
      ),
    ).toBe('stale')
  })

  it('stays online when there is no activity timestamp to judge by', () => {
    expect(
      deriveNodeStatus({ online: true, lastActivity: null }, 180_000, NOW),
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
        180_000,
        NOW,
      ),
    ).toEqual({ status: 'online', lastActivity: secondsAgo(10) })
  })

  it('does not flag stale while the stale window is still unknown', () => {
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
    expect(
      resolveNodeStatus(undefined, [secondsAgo(10)], 180_000, NOW),
    ).toEqual({ status: 'unknown', lastActivity: null })
  })
})
