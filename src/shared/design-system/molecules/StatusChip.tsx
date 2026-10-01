import type { TranslationKey } from '../../i18n/dictionary'
import { useTranslation } from '../../i18n/useTranslation'
import { StatusDot, type NodeStatus } from '../atoms/StatusDot'

export interface StatusChipProps {
  status: NodeStatus
}

const STATUS_KEYS: Record<NodeStatus, TranslationKey> = {
  online: 'status.online',
  stale: 'status.stale',
  offline: 'status.offline',
  unknown: 'status.unknown',
}

/** Translates a `NodeStatus` and renders it through `StatusDot` inside a pill. */
export function StatusChip({ status }: StatusChipProps) {
  const { t } = useTranslation()

  return (
    <span className="inline-flex items-center rounded-full bg-surface-raised px-2.5 py-1 text-sm">
      <StatusDot status={status} label={t(STATUS_KEYS[status])} />
    </span>
  )
}
