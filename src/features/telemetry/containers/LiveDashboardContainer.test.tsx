import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LiveDashboardContainer } from './LiveDashboardContainer'

const useLatestReadingsMock = vi.hoisted(() => vi.fn())
const useRealtimeReadingsMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useLatestReadings', () => ({
  useLatestReadings: useLatestReadingsMock,
}))
vi.mock('../application/useRealtimeReadings', () => ({
  useRealtimeReadings: useRealtimeReadingsMock,
}))

describe('LiveDashboardContainer', () => {
  it('shows the loading state while the initial fetch is pending', () => {
    useLatestReadingsMock.mockReturnValue({ data: undefined, isPending: true })
    useRealtimeReadingsMock.mockReturnValue({ status: 'connecting' })

    render(<LiveDashboardContainer />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the fetched readings and live connection status', () => {
    useLatestReadingsMock.mockReturnValue({
      data: {
        'sensor-a': {
          sensorId: 'sensor-a',
          value: 1,
          timestamp: 't',
          quality: 'ok',
          channel: 'temperature',
          unit: 'degC',
          sensorLabel: null,
          deviceName: 'Node A',
        },
      },
      isPending: false,
    })
    useRealtimeReadingsMock.mockReturnValue({ status: 'live' })

    render(<LiveDashboardContainer />)

    expect(screen.getByText('Node A')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/live/i)
  })
})
