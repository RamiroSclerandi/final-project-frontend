type MatviewGranularity = 'hourly' | 'daily'

const BUCKET_MS: Record<MatviewGranularity, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
}

const STALE_MULTIPLIER = 2

/**
 * D-7 / REQ-HS-7: the aggregation is "lagging" when the newest bucket is
 * more than two bucket-widths behind the newest raw measurement for the
 * sensor -- compared to the sensor's own data, never to wall-clock time,
 * so a quiet sensor with no new data is never mistaken for a stuck cron.
 */
export function isAggregationStale(
  lastBucketIso: string | null,
  newestRawIso: string | null,
  granularity: MatviewGranularity,
): boolean {
  if (!newestRawIso) {
    return false
  }
  if (!lastBucketIso) {
    return true
  }
  const age =
    new Date(newestRawIso).getTime() - new Date(lastBucketIso).getTime()
  if (age < 0) {
    return false
  }
  return age > BUCKET_MS[granularity] * STALE_MULTIPLIER
}
