import type { NodeStatus } from '../../lib/nodeStatus'

export type { NodeStatus }

export interface StatusDotProps {
  status: NodeStatus
  label: string
}

const STATUS_TEXT_CLASSES: Record<NodeStatus, string> = {
  online: 'text-status-online',
  stale: 'text-warning',
  offline: 'text-status-offline',
  unknown: 'text-status-unknown',
}

/**
 * Node/sensor status indicator (REQ-NODE-4): pairs a decorative glyph with
 * visible text so status is never conveyed by color alone. `label` is
 * already translated by the caller -- this atom never calls `t()`.
 */
export function StatusDot({ status, label }: StatusDotProps) {
  const colorClass = STATUS_TEXT_CLASSES[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        aria-hidden="true"
        viewBox="0 0 8 8"
        className={`h-2 w-2 ${colorClass}`}
      >
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
      <span className={colorClass}>{label}</span>
    </span>
  )
}
