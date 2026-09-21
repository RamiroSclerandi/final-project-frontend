import type { ReactNode } from 'react'

export interface IconButtonProps {
  label: string
  onClick?: () => void
  children: ReactNode
}

/**
 * An icon-only button. `label` (already translated by the caller) becomes
 * the accessible name; the icon itself stays `aria-hidden` since it carries
 * no information beyond what `label` already says.
 */
export function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text hover:bg-surface-raised"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
}
