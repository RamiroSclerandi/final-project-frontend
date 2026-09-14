import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DeviceStatusList } from './DeviceStatusList'

describe('DeviceStatusList', () => {
  it('renders nothing when there are no devices yet', () => {
    const { container } = render(<DeviceStatusList devices={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders one badge per device', () => {
    render(
      <DeviceStatusList
        devices={[
          { deviceId: 'a', name: 'Node A', online: true, lastSeen: null },
          { deviceId: 'b', name: 'Node B', online: false, lastSeen: null },
        ]}
      />,
    )

    expect(screen.getAllByRole('status')).toHaveLength(2)
  })
})
