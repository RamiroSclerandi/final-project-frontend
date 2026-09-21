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
  primary: 'bg-accent text-bg hover:opacity-90',
  secondary:
    'border border-border bg-transparent text-text hover:bg-surface-raised',
  danger: 'bg-danger text-bg hover:opacity-90',
}

/** A 44x44 minimum touch-target button with an explicit visual variant. */
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
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANT_CLASSES[variant]}`}
    >
      {children}
    </button>
  )
}
