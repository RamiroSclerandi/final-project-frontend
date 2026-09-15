import type { Granularity } from './chooseGranularity'

const BUCKET_MS: Record<Exclude<Granularity, 'raw'>, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
}

const STALE_MULTIPLIER = 2

/**
 * D-7: the aggregation is "lagging" when the newest bucket is more than
 * two bucket-widths behind now -- derived from the bucket's own size, never
 * from the cron schedule the frontend does not own.
 */
export function isAggregationStale(
  lastBucketIso: string | null,
  now: Date,
  granularity: Exclude<Granularity, 'raw'>,
): boolean {
  if (!lastBucketIso) {
    return true
  }
  const age = now.getTime() - new Date(lastBucketIso).getTime()
  return age > BUCKET_MS[granularity] * STALE_MULTIPLIER
}
