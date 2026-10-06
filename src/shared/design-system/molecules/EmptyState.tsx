import type { ReactNode } from 'react'

import { InboxIcon } from '../atoms/icons'

export interface EmptyStateProps {
  title: string
  body: string
  action?: ReactNode
}

/** A loading/error/empty placeholder. `title`/`body` are already translated by the caller. */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-strong bg-surface p-8 text-center">
      <span className="text-text-faint">
        <InboxIcon className="h-6 w-6" />
      </span>
      <p className="text-base font-medium text-text">{title}</p>
      <p className="max-w-prose text-sm text-text-muted">{body}</p>
      {action}
    </div>
  )
}
