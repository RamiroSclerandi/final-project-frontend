import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { NodeHealthContainer } from './NodeHealthContainer'

const useDeviceStatusesMock = vi.hoisted(() => vi.fn())
const useRealtimeDeviceStatusesMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useDeviceStatuses', () => ({
  useDeviceStatuses: useDeviceStatusesMock,
}))
vi.mock('../application/useRealtimeDeviceStatuses', () => ({
  useRealtimeDeviceStatuses: useRealtimeDeviceStatusesMock,
}))

describe('NodeHealthContainer', () => {
  it('renders one badge per fetched device', () => {
    useDeviceStatusesMock.mockReturnValue({
      data: {
        'device-a': {
          deviceId: 'device-a',
          name: 'Node A',
          online: true,
          lastSeen: null,
        },
      },
    })

    render(<NodeHealthContainer />)

    expect(screen.getByText(/node a/i)).toBeInTheDocument()
  })
})
