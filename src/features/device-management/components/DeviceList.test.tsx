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

const otherDevice: Device = {
  id: 'device-2',
  macAddress: '112233445566',
  name: 'Garage node',
  locationRef: 'Garage',
  transport: 'wifi-mqtt',
  provisioned: true,
  sensors: [
    {
      id: 'sensor-2',
      label: 'Door sensor',
      pinConnection: null,
      source: 'REED',
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
        errorDeviceId={null}
        errorSensorId={null}
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
        errorDeviceId={null}
        errorSensorId={null}
        errorMessage={null}
      />,
    )

    expect(screen.getByDisplayValue('Kitchen node')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fridge temp')).toBeInTheDocument()
  })

  it('shows the error only on the device row named by errorDeviceId, not on siblings', () => {
    render(
      <DeviceList
        devices={[device, otherDevice]}
        onSaveDevice={vi.fn()}
        onSaveSensor={vi.fn()}
        savingDeviceId={null}
        savingSensorId={null}
        errorDeviceId="device-1"
        errorSensorId={null}
        errorMessage="Could not save changes. Try again."
      />,
    )

    expect(screen.getByRole('alert').closest('form')).toContainElement(
      screen.getByDisplayValue('Kitchen node'),
    )
  })

  it('shows the error only on the sensor row named by errorSensorId, not on siblings', () => {
    render(
      <DeviceList
        devices={[device, otherDevice]}
        onSaveDevice={vi.fn()}
        onSaveSensor={vi.fn()}
        savingDeviceId={null}
        savingSensorId={null}
        errorDeviceId={null}
        errorSensorId="sensor-2"
        errorMessage="Could not save changes. Try again."
      />,
    )

    expect(screen.getByRole('alert').closest('form')).toContainElement(
      screen.getByDisplayValue('Door sensor'),
    )
  })
})
