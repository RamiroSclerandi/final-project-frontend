import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import type { Device } from '../domain/device'
import { DeviceEditForm } from './DeviceEditForm'

const device: Device = {
  id: 'device-1',
  macAddress: 'AABBCCDDEEFF',
  name: 'Kitchen node',
  locationRef: 'Kitchen',
  transport: 'wifi-mqtt',
  provisioned: true,
  firmwareVersion: null,
  ownerId: null,
  sensors: [],
}

describe('DeviceEditForm', () => {
  it('reports an allowlisted update with the edited values, never mac_address (REQ-DM-4)', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <DeviceEditForm
        device={device}
        onChange={onChange}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Renamed node' },
    })
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'Garage' },
    })
    fireEvent.change(screen.getByLabelText(/transport/i), {
      target: { value: 'lorawan' },
    })
    fireEvent.click(screen.getByLabelText(/provisioned/i))

    expect(onChange).toHaveBeenLastCalledWith({
      name: 'Renamed node',
      location_ref: 'Garage',
      transport: 'lorawan',
      provisioned: false,
    })
    expect(onChange.mock.lastCall?.[0]).not.toHaveProperty('mac_address')
  })

  it('reports null for a cleared location instead of an empty string', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <DeviceEditForm
        device={device}
        onChange={onChange}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: '' },
    })

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ location_ref: null }),
    )
  })

  it('shows the error message', () => {
    renderWithProviders(
      <DeviceEditForm
        device={device}
        onChange={vi.fn()}
        errorMessage="Could not save changes. Try again."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i)
  })
})
