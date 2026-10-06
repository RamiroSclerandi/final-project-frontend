import type { ReactNode } from 'react'

import { useTranslation } from '../../../shared/i18n/useTranslation'

export interface DegradedStateBannerProps {
  aggregationStale: boolean
  newestPointPartial: boolean
}

type CalloutTone = 'info' | 'warning'

const CALLOUT_TONE_CLASSES: Record<CalloutTone, string> = {
  info: 'border-info bg-info-soft text-info',
  warning: 'border-warning bg-warning-soft text-warning',
}

/** Leading glyph; the paired text carries the meaning, so it is decorative. */
function CalloutIcon({ tone }: { tone: CalloutTone }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0"
    >
      {tone === 'warning' ? (
        <>
          <path d="M8 2 1.5 13.5h13L8 2Z" />
          <path d="M8 6.5v3M8 11.5v.01" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 7.5v3.5M8 5v.01" />
        </>
      )}
    </svg>
  )
}

function Callout({
  tone,
  children,
}: {
  tone: CalloutTone
  children: ReactNode
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${CALLOUT_TONE_CLASSES[tone]}`}
    >
      <CalloutIcon tone={tone} />
      <p>{children}</p>
    </div>
  )
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
    <div className="flex flex-col gap-2">
      {aggregationStale && (
        <Callout tone="warning">
          {t('sensor.degraded.aggregationStale')}
        </Callout>
      )}
      {newestPointPartial && (
        <Callout tone="info">{t('sensor.degraded.newestPointPartial')}</Callout>
      )}
    </div>
  )
}
