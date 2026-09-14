import type { RealtimeStatus } from '../domain/connectionStatus'

const LABELS: Record<RealtimeStatus, string> = {
  connecting: 'Connecting…',
  live: 'Live',
  reconnecting: 'Reconnecting…',
  down: 'Disconnected',
}

export interface ConnectionStatusBadgeProps {
  status: RealtimeStatus
}

/** Minimal, always-visible indicator of the realtime channel's health (D-2/D-7). */
export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const isDegraded = status !== 'live'
  return (
    <p
      role="status"
      className={
        isDegraded ? 'text-sm text-amber-400' : 'text-sm text-emerald-400'
      }
    >
      {LABELS[status]}
    </p>
  )
}
