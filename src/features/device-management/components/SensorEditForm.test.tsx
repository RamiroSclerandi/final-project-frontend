import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import type { SensorSummary } from '../domain/device'
import { SensorEditForm } from './SensorEditForm'

const sensor: SensorSummary = {
  id: 'sensor-1',
  label: 'Fridge temp',
  pinConnection: 'GPIO4',
  source: 'DHT22',
  tag: '',
}

describe('SensorEditForm', () => {
  it('reports label and pin_connection only (REQ-DM-3)', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <SensorEditForm
        sensor={sensor}
        onChange={onChange}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: 'Freezer temp' },
    })
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: 'GPIO7' },
    })

    expect(onChange).toHaveBeenLastCalledWith({
      label: 'Freezer temp',
      pin_connection: 'GPIO7',
    })
  })

  it('reports null for a cleared label instead of an empty string', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <SensorEditForm
        sensor={sensor}
        onChange={onChange}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: '' } })

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ label: null }),
    )
  })
})
