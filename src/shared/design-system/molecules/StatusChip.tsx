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

/** Translates a `NodeStatus` and renders it through the `StatusDot` pill. */
export function StatusChip({ status }: StatusChipProps) {
  const { t } = useTranslation()

  return <StatusDot status={status} label={t(STATUS_KEYS[status])} />
}
