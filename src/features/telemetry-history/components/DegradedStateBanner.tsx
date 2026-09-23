import { useTranslation } from '../../../shared/i18n/useTranslation'

export interface DegradedStateBannerProps {
  aggregationStale: boolean
  newestPointPartial: boolean
}

/** D-7: aggregation lag and a still-forming newest point, never hidden. */
export function DegradedStateBanner({
  aggregationStale,
  newestPointPartial,
}: DegradedStateBannerProps) {
  const { t } = useTranslation()

  if (!aggregationStale && !newestPointPartial) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      {aggregationStale && (
        <p role="status" className="text-sm text-warning">
          {t('sensor.degraded.aggregationStale')}
        </p>
      )}
      {newestPointPartial && (
        <p role="status" className="text-sm text-warning">
          {t('sensor.degraded.newestPointPartial')}
        </p>
      )}
    </div>
  )
}
