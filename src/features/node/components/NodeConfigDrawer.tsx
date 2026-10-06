import { useEffect, useId, useRef, type ReactNode } from 'react'

import { IconButton } from '../../../shared/design-system/atoms/IconButton'
import { useTranslation } from '../../../shared/i18n/useTranslation'

export interface NodeConfigDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * Device configuration drawer (REQ-CFG-1, D8): a native `<dialog>` driven by
 * `showModal()`/`close()`, never a hand-rolled focus trap. Escape-to-close
 * and focus containment come from the browser for free; this component only
 * mirrors the `open` prop onto the dialog's imperative API and returns focus
 * to whatever opened it once the dialog's own `close` event fires.
 */
export function NodeConfigDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: NodeConfigDrawerProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<Element | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    if (open && !dialog.open) {
      openerRef.current = document.activeElement
      dialog.showModal()
    }
    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleClose() {
    onClose()
    ;(openerRef.current as HTMLElement | null)?.focus()
  }

  // `open:flex` (not `flex`) keeps the UA `display: none` of a closed dialog.
  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      aria-labelledby={titleId}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col overflow-hidden bg-surface p-0 text-text open:flex backdrop:bg-scrim md:left-auto md:w-120 md:max-w-120 md:border-l md:border-border"
    >
      <header className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate font-mono text-xs tabular-nums text-text-muted">
              {subtitle}
            </p>
          )}
        </div>
        <IconButton
          label={t('common.dismiss')}
          onClick={() => dialogRef.current?.close()}
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4">
            <path
              d="M3 3l10 10M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </IconButton>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-4 has-[>form]:pb-0">
        {children}
      </div>
    </dialog>
  )
}
