import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { RealtimeStatus } from '../domain/connectionStatus'

const LABEL_KEYS: Record<RealtimeStatus, TranslationKey> = {
  connecting: 'connection.connecting',
  live: 'connection.live',
  reconnecting: 'connection.reconnecting',
  down: 'connection.down',
}

const DOT_CLASSES: Record<RealtimeStatus, string> = {
  live: 'text-status-online',
  connecting: 'text-warning',
  reconnecting: 'text-warning',
  down: 'text-danger',
}

export interface ConnectionStatusBadgeProps {
  status: RealtimeStatus
}

/** Minimal, always-visible indicator of the realtime channel's health (D-2/D-7). */
export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <p
      role="status"
      className="inline-flex items-center gap-1.5 text-xs text-text-muted"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 8 8"
        className={`h-2 w-2 ${DOT_CLASSES[status]}`}
      >
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
      <span>{t(LABEL_KEYS[status])}</span>
    </p>
  )
}
