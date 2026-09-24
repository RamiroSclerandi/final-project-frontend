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
  it('shows the read-only mac address alongside the editable fields', () => {
    renderWithProviders(
      <DeviceEditForm
        device={device}
        onSave={vi.fn()}
        isSaving={false}
        errorMessage={null}
      />,
    )

    expect(screen.getByText('AABBCCDDEEFF')).toBeInTheDocument()
  })

  it('submits an allowlisted update with the edited values, never mac_address (REQ-DM-4)', () => {
    const onSave = vi.fn()
    renderWithProviders(
      <DeviceEditForm
        device={device}
        onSave={onSave}
        isSaving={false}
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
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onSave).toHaveBeenCalledWith({
      name: 'Renamed node',
      location_ref: 'Garage',
      transport: 'lorawan',
      provisioned: false,
    })
    expect(onSave.mock.calls[0]?.[0]).not.toHaveProperty('mac_address')
  })

  it('disables the submit button while saving and shows the error message', () => {
    renderWithProviders(
      <DeviceEditForm
        device={device}
        onSave={vi.fn()}
        isSaving={true}
        errorMessage="Could not save changes. Try again."
      />,
    )

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i)
  })
})
