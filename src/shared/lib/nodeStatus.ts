export type NodeStatus = 'online' | 'stale' | 'offline' | 'unknown'

/** Firmware default (`DeviceConfig.cpp`) for nodes with no requested interval. */
export const DEFAULT_SAMPLING_INTERVAL_MS = 5_000

const STALE_AFTER_INTERVALS = 3
// The worker refreshes devices.last_seen at most once a minute.
const MIN_STALE_AFTER_MS = 60_000

export interface NodeStatusInput {
  online: boolean
  lastActivity: string | null
}

/**
 * Online/offline comes from the broker's Last Will; an online node silent for
 * more than three sampling intervals is `stale`, since a dropped connection
 * can take minutes to reach the broker.
 */
export function deriveNodeStatus(
  status: NodeStatusInput | undefined,
  samplingIntervalMs: number,
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
  const staleAfterMs = Math.max(
    STALE_AFTER_INTERVALS * samplingIntervalMs,
    MIN_STALE_AFTER_MS,
  )
  const silentMs = nowMs - Date.parse(status.lastActivity)
  return silentMs > staleAfterMs ? 'stale' : 'online'
}

/** The newest of the given ISO timestamps, or `null` when there is none. */
export function latestTimestamp(
  timestamps: ReadonlyArray<string | null>,
): string | null {
  let latest: string | null = null
  for (const timestamp of timestamps) {
    if (
      timestamp !== null &&
      (latest === null || Date.parse(timestamp) > Date.parse(latest))
    ) {
      latest = timestamp
    }
  }
  return latest
}
