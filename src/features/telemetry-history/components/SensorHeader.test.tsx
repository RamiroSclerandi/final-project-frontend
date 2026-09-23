import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { SensorHeader } from './SensorHeader'

describe('SensorHeader', () => {
  it('renders the breadcrumb and the sensor label as the heading', () => {
    renderWithProviders(
      <SensorHeader
        deviceId="device-1"
        reading={{
          deviceName: 'Node A',
          sensorLabel: 'Greenhouse',
          channel: 'temperature',
          unit: 'degC',
          value: 21.5,
          quality: 'ok',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Greenhouse' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Node A' })).toHaveAttribute(
      'href',
      '/nodes/device-1',
    )
    expect(screen.getByRole('link', { name: 'Fleet' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('falls back to the channel when there is no sensor label', () => {
    renderWithProviders(
      <SensorHeader
        deviceId="device-1"
        reading={{
          deviceName: 'Node A',
          sensorLabel: null,
          channel: 'temperature',
          unit: 'degC',
          value: 21.5,
          quality: 'ok',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'temperature' }),
    ).toBeInTheDocument()
  })

  it('shows a neutral title and the device id when the reading is not yet cached', () => {
    renderWithProviders(<SensorHeader deviceId="device-1" />)

    expect(screen.getByRole('link', { name: 'device-1' })).toHaveAttribute(
      'href',
      '/nodes/device-1',
    )
  })

  it('shows the reading quality with a visible text label, never color alone', () => {
    renderWithProviders(
      <SensorHeader
        deviceId="device-1"
        reading={{
          deviceName: 'Node A',
          sensorLabel: 'Greenhouse',
          channel: 'temperature',
          unit: 'degC',
          value: 21.5,
          quality: 'out_of_range',
        }}
      />,
    )

    expect(screen.getByText('Out of range')).toBeInTheDocument()
  })
})
