export type NodeStatus = 'online' | 'stale' | 'offline' | 'unknown'

const STALE_AFTER_INTERVALS = 3
// The worker refreshes devices.last_seen at most once a minute; a floor of two
// refreshes keeps a node from flickering stale while Realtime is down.
const MIN_STALE_AFTER_MS = 120_000
// A node with no config row may run an interval set over serial that the
// dashboard cannot see, so it gets a wide window instead of the firmware default.
const UNCONFIGURED_STALE_AFTER_MS = 5 * 60_000

export interface NodeStatusInput {
  online: boolean
  lastActivity: string | null
}

/**
 * Online/offline comes from the broker's Last Will; an online node silent for
 * longer than `staleAfterMs` is `stale`, since a dropped connection can take
 * minutes to reach the broker.
 */
export function deriveNodeStatus(
  status: NodeStatusInput | undefined,
  staleAfterMs: number,
  nowMs: number,
): NodeStatus {
  if (!status) {
    return 'unknown'
  }
  if (!status.online) {
    return 'offline'
  }
  if (status.lastActivity === null) {
    return 'online'
  }
  const silentMs = nowMs - Date.parse(status.lastActivity)
  return silentMs > staleAfterMs ? 'stale' : 'online'
}

/** The newest parseable ISO timestamp, or `null` when there is none. */
export function latestTimestamp(
  timestamps: ReadonlyArray<string | null>,
): string | null {
  let latest: string | null = null
  let latestMs = -Infinity
  for (const timestamp of timestamps) {
    const ms = timestamp === null ? NaN : Date.parse(timestamp)
    if (ms > latestMs) {
      latest = timestamp
      latestMs = ms
    }
  }
  return latest
}

/**
 * How long a device may stay silent before it is `stale`: three of its
 * requested intervals (two minutes at least), five minutes without a config
 * row, or `null` before configs load.
 */
export function pickStaleAfterMs(
  intervalsById: Readonly<Record<string, number>> | null,
  deviceId: string,
): number | null {
  if (intervalsById === null) {
    return null
  }
  const intervalMs = intervalsById[deviceId]
  if (intervalMs === undefined) {
    return UNCONFIGURED_STALE_AFTER_MS
  }
  return Math.max(STALE_AFTER_INTERVALS * intervalMs, MIN_STALE_AFTER_MS)
}

export interface ResolvedNodeStatus {
  status: NodeStatus
  lastActivity: string | null
}

/**
 * Status plus last activity for one device. Activity is the newest of
 * `last_seen` and its readings, because the worker throttles `last_seen`.
 * A `null` window (configs not loaded yet) never flags a node stale.
 */
export function resolveNodeStatus(
  status: { online: boolean; lastSeen: string | null } | undefined,
  readingTimestamps: ReadonlyArray<string>,
  staleAfterMs: number | null,
  nowMs: number,
): ResolvedNodeStatus {
  if (!status) {
    return { status: 'unknown', lastActivity: null }
  }
  const lastActivity = latestTimestamp([status.lastSeen, ...readingTimestamps])
  const judged = deriveNodeStatus(
    {
      online: status.online,
      lastActivity: staleAfterMs === null ? null : lastActivity,
    },
    staleAfterMs ?? 0,
    nowMs,
  )
  return { status: judged, lastActivity }
}
