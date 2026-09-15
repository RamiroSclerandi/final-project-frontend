import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HistoryTitleContainer } from './HistoryTitleContainer'

const useLatestReadingsMock = vi.hoisted(() => vi.fn())

vi.mock('../../telemetry', () => ({
  useLatestReadings: useLatestReadingsMock,
}))

describe('HistoryTitleContainer', () => {
  it('looks up the sensor by id and shows device name + sensor label', () => {
    useLatestReadingsMock.mockReturnValue({
      data: {
        'sensor-a': {
          sensorId: 'sensor-a',
          value: 1,
          timestamp: 't',
          quality: 'ok',
          channel: 'temperature',
          unit: 'degC',
          sensorLabel: 'Greenhouse',
          deviceName: 'Node A',
        },
      },
    })

    render(<HistoryTitleContainer sensorId="sensor-a" />)

    expect(
      screen.getByRole('heading', { name: /node a.*greenhouse/i }),
    ).toBeInTheDocument()
  })

  it('shows the neutral title when the sensor is not in the cache yet', () => {
    useLatestReadingsMock.mockReturnValue({ data: undefined })

    render(<HistoryTitleContainer sensorId="sensor-a" />)

    expect(screen.getByRole('heading')).toHaveTextContent(/sensor history/i)
  })
})
