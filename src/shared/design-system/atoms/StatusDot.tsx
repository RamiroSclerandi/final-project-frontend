import type { NodeStatus } from '../../lib/nodeStatus'

export type { NodeStatus }

export interface StatusDotProps {
  status: NodeStatus
  label: string
}

const STATUS_PILL_CLASSES: Record<NodeStatus, string> = {
  online: 'border-status-online bg-status-online-soft text-status-online',
  stale: 'border-warning bg-warning-soft text-warning',
  offline: 'border-border bg-sunken text-status-offline',
  unknown: 'border-border bg-sunken text-status-unknown',
}

/**
 * Node/sensor status indicator (REQ-NODE-4): pairs a decorative glyph with
 * visible text so status is never conveyed by color alone. `label` is
 * already translated by the caller -- this atom never calls `t()`.
 */
export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-2xs uppercase tracking-label ${STATUS_PILL_CLASSES[status]}`}
    >
      <svg aria-hidden="true" viewBox="0 0 8 8" className="h-2 w-2">
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
      <span>{label}</span>
    </span>
  )
}
