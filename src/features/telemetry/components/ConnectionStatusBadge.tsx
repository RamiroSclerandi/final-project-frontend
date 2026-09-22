import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { RealtimeStatus } from '../domain/connectionStatus'

const LABEL_KEYS: Record<RealtimeStatus, TranslationKey> = {
  connecting: 'connection.connecting',
  live: 'connection.live',
  reconnecting: 'connection.reconnecting',
  down: 'connection.down',
}

export interface ConnectionStatusBadgeProps {
  status: RealtimeStatus
}

/** Minimal, always-visible indicator of the realtime channel's health (D-2/D-7). */
export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const { t } = useTranslation()
  const isDegraded = status !== 'live'
  return (
    <p
      role="status"
      className={isDegraded ? 'text-sm text-warning' : 'text-sm text-success'}
    >
      {t(LABEL_KEYS[status])}
    </p>
  )
}
