import { Button } from '../../../shared/design-system/atoms/Button'
import { useTranslation } from '../../../shared/i18n/useTranslation'

export interface ExportButtonProps {
  onExport: () => void
  isExporting: boolean
  error: string | null
}

/** Triggers CSV export of the selected range (CA-4); busy state disables re-clicks. */
export function ExportButton({
  onExport,
  isExporting,
  error,
}: ExportButtonProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" onClick={onExport} disabled={isExporting}>
        {isExporting
          ? t('sensor.export.inProgress')
          : t('sensor.export.action')}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
