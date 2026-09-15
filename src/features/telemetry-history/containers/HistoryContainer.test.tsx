import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HistoricalPoint } from '../domain/historicalPoint'
import { HistoryContainer } from './HistoryContainer'

const useHistoricalSeriesMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useHistoricalSeries', () => ({
  useHistoricalSeries: useHistoricalSeriesMock,
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

  it('re-queries the hook with a new range when a preset is picked', () => {
    render(<HistoryContainer sensorId={SENSOR_ID} />)

    fireEvent.click(screen.getByRole('button', { name: /1 hour/i }))

    expect(useHistoricalSeriesMock).toHaveBeenLastCalledWith(
      SENSOR_ID,
      new Date(NOW.getTime() - 60 * 60 * 1000),
      NOW,
    )
  })
})
