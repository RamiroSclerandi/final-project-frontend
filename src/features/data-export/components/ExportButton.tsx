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
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={onExport} disabled={isExporting}>
        {isExporting ? 'Exporting…' : 'Export CSV'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
