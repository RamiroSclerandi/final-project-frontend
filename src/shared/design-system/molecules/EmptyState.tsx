import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  body: string
  action?: ReactNode
}

/** A loading/error/empty placeholder. `title`/`body` are already translated by the caller. */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface p-8 text-center">
      <p className="text-base font-medium text-text">{title}</p>
      <p className="text-sm text-text-muted">{body}</p>
      {action}
    </div>
  )
}
