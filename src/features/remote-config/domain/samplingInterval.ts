export const MIN_SAMPLING_INTERVAL_MS = 1000
export const MAX_SAMPLING_INTERVAL_MS = 300000
export const MIN_SAMPLING_INTERVAL_SECONDS = MIN_SAMPLING_INTERVAL_MS / 1000
export const MAX_SAMPLING_INTERVAL_SECONDS = MAX_SAMPLING_INTERVAL_MS / 1000

export function samplingIntervalSecondsToMs(seconds: number): number {
  return Math.round(seconds * 1000)
}

export function samplingIntervalMsToSeconds(ms: number): number {
  return ms / 1000
}

/**
 * Client-side convenience check only (REQ-RC-2) -- the set-sampling-interval
 * function is the authority; this just avoids a round trip for an obviously
 * out-of-range value.
 */
export function isSamplingIntervalMsInRange(ms: number): boolean {
  return (
    Number.isInteger(ms) &&
    ms >= MIN_SAMPLING_INTERVAL_MS &&
    ms <= MAX_SAMPLING_INTERVAL_MS
  )
}
