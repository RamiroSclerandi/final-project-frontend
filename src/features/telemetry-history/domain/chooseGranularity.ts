export type Granularity = 'raw' | 'minute' | 'hourly' | 'daily'

/** REQ-HS-8: an explicit user override, or 'auto' to fall back to REQ-HS-1. */
export type GranularityChoice = Granularity | 'auto'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const NINETY_DAYS_MS = 90 * DAY_MS

/**
 * REQ-HS-1: pure granularity boundary -- no network, no clock (D-3). Bounds
 * are inclusive so every preset lands on its target-table bucket, which keeps
 * the chart near 300-1500 points whatever the sampling interval.
 */
export function chooseGranularity(rangeMs: number): Granularity {
  if (rangeMs <= HOUR_MS) {
    return 'raw'
  }
  if (rangeMs <= DAY_MS) {
    return 'minute'
  }
  if (rangeMs <= NINETY_DAYS_MS) {
    return 'hourly'
  }
  return 'daily'
}
