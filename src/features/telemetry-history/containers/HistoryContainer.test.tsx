import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HistoricalPoint } from '../domain/historicalPoint'
import { HistoryContainer } from './HistoryContainer'

const useHistoricalSeriesMock = vi.hoisted(() => vi.fn())
const useCsvExportMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useHistoricalSeries', () => ({
  useHistoricalSeries: useHistoricalSeriesMock,
}))
vi.mock('../../data-export', () => ({
  useCsvExport: useCsvExportMock,
  ExportButton: ({
    onExport,
    isExporting,
  }: {
    onExport: () => void
    isExporting: boolean
  }) => (
    <button type="button" onClick={onExport} disabled={isExporting}>
      Export CSV
    </button>
  ),
}))

const NOW = new Date('2026-09-15T12:00:00Z')
const SENSOR_ID = 'sensor-1'

function baseResult(points: HistoricalPoint[] = []) {
  return {
    granularity: 'hourly' as const,
    points,
    isLoading: false,
    error: null,
    queryDurationMs: 10,
    aggregationStale: false,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  useHistoricalSeriesMock.mockReset().mockReturnValue(baseResult())
  useCsvExportMock
    .mockReset()
    .mockReturnValue({ exportRange: vi.fn(), isExporting: false, error: null })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('HistoryContainer', () => {
  it('wires the picker, hook, and chart for the given sensor', () => {
    useHistoricalSeriesMock.mockReturnValue(
      baseResult([{ t: '2026-09-15T11:00:00Z', value: 21, quality: 'ok' }]),
    )

    const { container } = render(<HistoryContainer sensorId={SENSOR_ID} />)

    expect(useHistoricalSeriesMock).toHaveBeenCalledWith(
      SENSOR_ID,
      expect.any(Date),
      expect.any(Date),
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('shows the stale-aggregation banner from the hook result', () => {
    useHistoricalSeriesMock.mockReturnValue({
      ...baseResult(),
      aggregationStale: true,
    })

    render(<HistoryContainer sensorId={SENSOR_ID} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      /aggregated data is behind/i,
    )
  })

  it('shows the provisional banner when the newest point is partial', () => {
    useHistoricalSeriesMock.mockReturnValue(
      baseResult([
        { t: '2026-09-15T11:00:00Z', value: 21, quality: 'ok', partial: true },
      ]),
    )

    render(<HistoryContainer sensorId={SENSOR_ID} />)

    expect(screen.getByRole('status')).toHaveTextContent(/provisional/i)
  })

  it('shows the provisional banner from the raw last point above the chart point budget (REQ-HS-4)', () => {
    const points: HistoricalPoint[] = Array.from({ length: 5000 }, (_, i) => ({
      t: new Date(Date.UTC(2026, 8, 15) + i * 15_000).toISOString(),
      value: 20 + (i % 3),
      quality: 'ok',
    }))
    points.push({
      t: new Date(Date.UTC(2026, 8, 15) + 5000 * 15_000).toISOString(),
      value: 30,
      quality: 'ok',
      partial: true,
    })
    useHistoricalSeriesMock.mockReturnValue(baseResult(points))

    render(<HistoryContainer sensorId={SENSOR_ID} />)

    expect(screen.getByRole('status')).toHaveTextContent(/provisional/i)
  })

  it('re-queries the hook with a new range when a preset is picked', () => {
    render(<HistoryContainer sensorId={SENSOR_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /1 hour/i }))

    expect(useHistoricalSeriesMock).toHaveBeenLastCalledWith(
      SENSOR_ID,
      new Date(NOW.getTime() - 60 * 60 * 1000),
      NOW,
    )
  })

  it('exports the currently selected sensor and range (CA-4)', () => {
    const exportRange = vi.fn()
    useCsvExportMock.mockReturnValue({
      exportRange,
      isExporting: false,
      error: null,
    })

    render(<HistoryContainer sensorId={SENSOR_ID} />)
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }))

    expect(exportRange).toHaveBeenCalledWith(
      SENSOR_ID,
      new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      NOW.toISOString(),
    )
  })
})
