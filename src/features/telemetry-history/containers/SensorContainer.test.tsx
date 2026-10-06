import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import type { HistoricalPoint } from '../domain/historicalPoint'
import { SensorContainer } from './SensorContainer'

const useHistoricalSeriesMock = vi.hoisted(() => vi.fn())
const useCsvExportMock = vi.hoisted(() => vi.fn())
const useLatestReadingsMock = vi.hoisted(() => vi.fn())
const useLiveSeriesMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useHistoricalSeries', () => ({
  useHistoricalSeries: useHistoricalSeriesMock,
}))
vi.mock('../application/useLiveSeries', () => ({
  useLiveSeries: useLiveSeriesMock,
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
vi.mock('../../telemetry', () => ({
  useLatestReadings: useLatestReadingsMock,
}))

const NOW = new Date('2026-09-15T12:00:00Z')
const DEVICE_ID = 'device-1'
const SENSOR_ID = 'sensor-1'

function baseResult(points: HistoricalPoint[] = []) {
  return {
    granularity: 'hourly' as const,
    points,
    isLoading: false,
    error: null,
    queryDurationMs: 10,
    aggregationStale: false,
    refetch: vi.fn(),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  useHistoricalSeriesMock.mockReset().mockReturnValue(baseResult())
  useCsvExportMock
    .mockReset()
    .mockReturnValue({ exportRange: vi.fn(), isExporting: false, error: null })
  useLatestReadingsMock.mockReset().mockReturnValue({ data: undefined })
  useLiveSeriesMock
    .mockReset()
    .mockImplementation(
      ({ basePoints }: { basePoints: HistoricalPoint[] }) => ({
        points: basePoints,
        updatedAtMs: null,
      }),
    )
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SensorContainer', () => {
  it('wires the picker, hook, and chart for the given sensor', () => {
    useHistoricalSeriesMock.mockReturnValue(
      baseResult([{ t: '2026-09-15T11:00:00Z', value: 21, quality: 'ok' }]),
    )

    const { container } = renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    expect(useHistoricalSeriesMock).toHaveBeenCalledWith(
      SENSOR_ID,
      expect.any(Date),
      expect.any(Date),
      'auto',
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('opens on the last hour without any interaction', () => {
    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    expect(useHistoricalSeriesMock).toHaveBeenCalledWith(
      SENSOR_ID,
      new Date(NOW.getTime() - 60 * 60 * 1000),
      NOW,
      'auto',
    )
  })

  it('shows the stale-aggregation banner from the hook result', () => {
    useHistoricalSeriesMock.mockReturnValue({
      ...baseResult(),
      aggregationStale: true,
    })

    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

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

    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

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

    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/provisional/i)
    // Renders the real chart (LTTB + Recharts SVG) in jsdom, which can exceed
    // the default 5 s timeout under full-suite contention.
  }, 15_000)

  it('re-queries the hook with a new range when a preset is picked', () => {
    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '6 hours' }))

    expect(useHistoricalSeriesMock).toHaveBeenLastCalledWith(
      SENSOR_ID,
      new Date(NOW.getTime() - 6 * 60 * 60 * 1000),
      NOW,
      'auto',
    )
  })

  it('requests a new granularity from the hook when the override changes (REQ-HS-8)', () => {
    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    fireEvent.change(screen.getByLabelText(/granularity/i), {
      target: { value: 'daily' },
    })

    expect(useHistoricalSeriesMock).toHaveBeenLastCalledWith(
      SENSOR_ID,
      expect.any(Date),
      expect.any(Date),
      'daily',
    )
  })

  it('exports the currently selected sensor and range (CA-4)', () => {
    const exportRange = vi.fn()
    useCsvExportMock.mockReturnValue({
      exportRange,
      isExporting: false,
      error: null,
    })

    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }))

    expect(exportRange).toHaveBeenCalledWith(
      SENSOR_ID,
      new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(),
      NOW.toISOString(),
    )
  })

  it("renders the sensor's breadcrumb and latest value once the reading is cached", () => {
    useLatestReadingsMock.mockReturnValue({
      data: {
        [SENSOR_ID]: {
          sensorId: SENSOR_ID,
          deviceId: DEVICE_ID,
          value: 21.5,
          timestamp: '2026-09-15T11:00:00Z',
          quality: 'ok',
          channel: 'temperature',
          unit: 'degC',
          sensorLabel: 'Greenhouse',
          sensorTag: 'l1',
          deviceName: 'Node A',
          rssi: -60,
        },
      },
    })

    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    expect(
      screen.getByRole('heading', { name: 'Greenhouse' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Node A' })).toHaveAttribute(
      'href',
      `/nodes/${DEVICE_ID}`,
    )
  })

  it('keeps the default last hour live as a window sliding to now (F-10)', () => {
    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    expect(useLiveSeriesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        sensorId: SENSOR_ID,
        isBaseReady: true,
        window: { kind: 'relative', rangeMs: 60 * 60 * 1000 },
      }),
    )
  })

  it('treats a custom date range as fixed (F-10)', () => {
    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    fireEvent.change(screen.getByLabelText(/from/i), {
      target: { value: '2026-09-10T00:00' },
    })

    expect(useLiveSeriesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        window: {
          kind: 'fixed',
          fromMs: new Date('2026-09-10T00:00').getTime(),
          toMs: NOW.getTime(),
        },
      }),
    )
  })

  it('draws the live series rather than the loaded one (F-10)', () => {
    useHistoricalSeriesMock.mockReturnValue(
      baseResult([{ t: '2026-09-15T11:00:00Z', value: 21, quality: 'ok' }]),
    )
    useLiveSeriesMock.mockReturnValue({
      points: [
        { t: '2026-09-15T11:00:00Z', value: 21, quality: 'ok' },
        { t: '2026-09-15T11:59:00Z', value: 22, quality: 'ok', partial: true },
      ],
      updatedAtMs: null,
    })

    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/provisional/i)
  })

  it('re-anchors a preset window to now when the live series asks for a fresh load (F-10)', () => {
    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )
    const later = new Date(NOW.getTime() + 10 * 60 * 1000)
    vi.setSystemTime(later)

    act(() => {
      const options = useLiveSeriesMock.mock.lastCall?.[0] as {
        onBaseStale: () => void
      }
      options.onBaseStale()
    })

    expect(useHistoricalSeriesMock).toHaveBeenLastCalledWith(
      SENSOR_ID,
      new Date(later.getTime() - 60 * 60 * 1000),
      later,
      'auto',
    )
  })

  it('reloads a fixed range in place when the live series asks for a fresh load (F-10)', () => {
    const refetch = vi.fn()
    useHistoricalSeriesMock.mockReturnValue({ ...baseResult(), refetch })
    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )
    fireEvent.change(screen.getByLabelText(/from/i), {
      target: { value: '2026-09-10T00:00' },
    })

    act(() => {
      const options = useLiveSeriesMock.mock.lastCall?.[0] as {
        onBaseStale: () => void
      }
      options.onBaseStale()
    })

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('moves "from" with each live reading while a preset is live', () => {
    const updatedAtMs = NOW.getTime() + 3 * 60 * 1000
    useLiveSeriesMock.mockReturnValue({ points: [], updatedAtMs })

    renderWithProviders(
      <SensorContainer deviceId={DEVICE_ID} sensorId={SENSOR_ID} />,
    )

    const expected = new Date(updatedAtMs - 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    expect(screen.getByLabelText(/from/i)).toHaveValue(
      `${expected.getFullYear()}-${pad(expected.getMonth() + 1)}-${pad(expected.getDate())}T${pad(expected.getHours())}:${pad(expected.getMinutes())}`,
    )
    expect(screen.getByRole('button', { name: '1 hour' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
