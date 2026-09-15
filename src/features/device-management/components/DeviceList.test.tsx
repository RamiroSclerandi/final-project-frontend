import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Device } from '../domain/device'
import { DeviceList } from './DeviceList'

const device: Device = {
  id: 'device-1',
  macAddress: 'AABBCCDDEEFF',
  name: 'Kitchen node',
  locationRef: 'Kitchen',
  transport: 'wifi-mqtt',
  provisioned: true,
  sensors: [
    {
      id: 'sensor-1',
      label: 'Fridge temp',
      pinConnection: null,
      source: 'DHT22',
      tag: '',
    },
  ],
}

describe('DeviceList', () => {
  it('shows a message when there are no devices yet', () => {
    render(
      <DeviceList
        devices={[]}
        onSaveDevice={vi.fn()}
        onSaveSensor={vi.fn()}
        savingDeviceId={null}
        savingSensorId={null}
        errorMessage={null}
      />,
    )

    expect(screen.getByText(/no devices/i)).toBeInTheDocument()
  })

  it('renders one device edit form and one form per sensor', () => {
    render(
      <DeviceList
        devices={[device]}
        onSaveDevice={vi.fn()}
        onSaveSensor={vi.fn()}
        savingDeviceId={null}
        savingSensorId={null}
        errorMessage={null}
      />,
    )

    expect(screen.getByDisplayValue('Kitchen node')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fridge temp')).toBeInTheDocument()
  })
})
