import { useId } from 'react'

import { EmptyState } from '../molecules/EmptyState'
import { VisuallyHidden } from '../atoms/VisuallyHidden'

export interface ReservedPageProps {
  title: string
  description: string
}

/**
 * A placeholder for a route whose feature has not shipped yet (REQ-SHELL-2,
 * REQ-ADMIN-2). The section gets its accessible name from a visually
 * hidden heading, since `EmptyState` already shows `title` visibly as part
 * of its own content -- this avoids rendering the same text twice.
 */
export function ReservedPage({ title, description }: ReservedPageProps) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="p-4">
      <VisuallyHidden>
        <h1 id={headingId}>{title}</h1>
      </VisuallyHidden>
      <EmptyState title={title} body={description} />
    </section>
  )
}
