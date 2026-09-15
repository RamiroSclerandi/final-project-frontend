export interface DegradedStateBannerProps {
  aggregationStale: boolean
  newestPointPartial: boolean
}

/** D-7: aggregation lag and a still-forming newest point, never hidden. */
export function DegradedStateBanner({
  aggregationStale,
  newestPointPartial,
}: DegradedStateBannerProps) {
  if (!aggregationStale && !newestPointPartial) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      {aggregationStale && (
        <p role="status" className="text-sm text-amber-400">
          Aggregated data is behind; newest points may be missing.
        </p>
      )}
      {newestPointPartial && (
        <p role="status" className="text-sm text-amber-400">
          The newest point is provisional and may still change.
        </p>
      )}
    </div>
  )
}
