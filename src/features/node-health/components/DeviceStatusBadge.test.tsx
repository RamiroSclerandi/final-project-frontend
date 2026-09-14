import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DeviceStatusBadge } from './DeviceStatusBadge'

describe('DeviceStatusBadge', () => {
  it('shows an online label when the device is online', () => {
    render(
      <DeviceStatusBadge
        device={{ deviceId: 'a', name: 'Node A', online: true, lastSeen: null }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/node a.*online/i)
  })

  it('shows an offline label with the last-seen time when the device is offline (D-7: never hidden)', () => {
    render(
      <DeviceStatusBadge
        device={{
          deviceId: 'b',
          name: 'Node B',
          online: false,
          lastSeen: '2026-09-14T12:00:00Z',
        }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      /node b.*offline.*2026-09-14T12:00:00Z/i,
    )
  })
})
