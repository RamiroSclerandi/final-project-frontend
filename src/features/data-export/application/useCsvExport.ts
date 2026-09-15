import { useState } from 'react'

import { fetchRawMeasurements } from '../../telemetry-history/infrastructure/historyRepository'
import { toExportCsv } from '../domain/exportCsv'
import { toSafeExportErrorMessage } from '../domain/exportError'
import { downloadCsv } from '../infrastructure/downloadCsv'

interface CsvExportState {
  isExporting: boolean
  error: string | null
}

/**
 * Fetches the raw range -- REQ-DE-2's pagination lives in the reused
 * `fetchRawMeasurements` loop -- serializes it, and triggers the download
 * (REQ-DE-1).
 */
export function useCsvExport() {
  const [state, setState] = useState<CsvExportState>({
    isExporting: false,
    error: null,
  })

  async function exportRange(sensorId: string, fromIso: string, toIso: string) {
    setState({ isExporting: true, error: null })
    try {
      const points = await fetchRawMeasurements(sensorId, fromIso, toIso)
      const csv = toExportCsv(sensorId, points)
      downloadCsv(csv, `sensor-${sensorId}_${fromIso}_${toIso}.csv`)
      setState({ isExporting: false, error: null })
    } catch (error) {
      setState({ isExporting: false, error: toSafeExportErrorMessage(error) })
    }
  }

  return { exportRange, isExporting: state.isExporting, error: state.error }
}
