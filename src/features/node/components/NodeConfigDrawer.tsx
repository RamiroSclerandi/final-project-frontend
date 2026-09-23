import { useEffect, useId, useRef, type ReactNode } from 'react'

import { IconButton } from '../../../shared/design-system/atoms/IconButton'
import { useTranslation } from '../../../shared/i18n/useTranslation'

export interface NodeConfigDrawerProps {
  open: boolean
  onClose: () => void
  title: string
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

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      aria-labelledby={titleId}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-4 text-text md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-96 md:max-w-96"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
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
      </div>
      <div className="mt-4 flex flex-col gap-6">{children}</div>
    </dialog>
  )
}
