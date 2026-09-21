import type { ReactNode } from 'react'

export interface VisuallyHiddenProps {
  children: ReactNode
}

/** Keeps content available to assistive technology while hiding it visually. */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>
}
