/**
 * Cache keys shared between `useLatestReadings` and `useRealtimeReadings`
 * (D-2). Kept in domain, not in either hook, so neither hook's test needs to
 * import the other and drag in its infrastructure module.
 */
export const LATEST_READINGS_QUERY_KEY = ['latestReadings'] as const
export const LIVE_SERIES_QUERY_KEY = ['liveSeries'] as const
