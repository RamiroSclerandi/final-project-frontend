import type { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ButtonProps {
  variant: ButtonVariant
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}

// Explicit variant classes (composition-patterns: variants over boolean
// modes) instead of an `isPrimary`/`isDanger` boolean pair.
const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-bg hover:opacity-90 disabled:bg-sunken disabled:text-text-faint disabled:ring-1 disabled:ring-border disabled:ring-inset disabled:hover:opacity-100',
  secondary:
    'border border-border-strong bg-sunken text-text hover:bg-surface-raised',
  danger:
    'bg-danger text-bg hover:opacity-90 disabled:bg-sunken disabled:text-text-faint disabled:ring-1 disabled:ring-border disabled:ring-inset disabled:hover:opacity-100',
}

/** A 44px touch-target button (36px from `md:`) with an explicit visual variant. */
export function Button({
  variant,
  type = 'button',
  disabled,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm font-medium md:min-h-9 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANT_CLASSES[variant]}`}
    >
      {children}
    </button>
  )
}
