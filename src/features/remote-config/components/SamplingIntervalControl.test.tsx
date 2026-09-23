import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import type { DeviceConfigSummary } from '../domain/deviceConfig'
import { SamplingIntervalControl } from './SamplingIntervalControl'

const summary: DeviceConfigSummary = {
  deviceId: 'device-1',
  deviceName: 'Kitchen node',
  config: null,
}

describe('SamplingIntervalControl', () => {
  it('shows "Not configured" when there is no device_configs row yet', () => {
    renderWithProviders(
      <SamplingIntervalControl
        summary={summary}
        onApply={vi.fn()}
        isSaving={false}
        errorMessage={null}
      />,
    )

    expect(screen.getByText('Not configured')).toBeInTheDocument()
  })

  it('shows the requested value and relative time, never an applied-state string (REQ-CFG-3, REQ-RC-11)', () => {
    renderWithProviders(
      <SamplingIntervalControl
        summary={{
          ...summary,
          config: {
            samplingIntervalMs: 30000,
            requestedAt: new Date().toISOString(),
          },
        }}
        onApply={vi.fn()}
        isSaving={false}
        errorMessage={null}
      />,
    )

    expect(screen.getByText(/^Requested 30 s ·/)).toBeInTheDocument()
    expect(screen.queryByText(/applied/i)).not.toBeInTheDocument()
  })

  it('applies the entered seconds, converted to milliseconds, within range (REQ-RC-2)', () => {
    const onApply = vi.fn()
    renderWithProviders(
      <SamplingIntervalControl
        summary={summary}
        onApply={onApply}
        isSaving={false}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/sampling interval/i), {
      target: { value: '60' },
    })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    expect(onApply).toHaveBeenCalledWith(60000)
  })

  it('disables Apply and shows a range message for an out-of-range value, without calling onApply', () => {
    const onApply = vi.fn()
    renderWithProviders(
      <SamplingIntervalControl
        summary={summary}
        onApply={onApply}
        isSaving={false}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/sampling interval/i), {
      target: { value: '301' },
    })

    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/between 1 and 300/i)
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onApply).not.toHaveBeenCalled()
  })

  it('disables Apply while saving', () => {
    renderWithProviders(
      <SamplingIntervalControl
        summary={summary}
        onApply={vi.fn()}
        isSaving={true}
        errorMessage={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/sampling interval/i), {
      target: { value: '60' },
    })
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
  })

  it('shows a server error message when the value is otherwise valid', () => {
    renderWithProviders(
      <SamplingIntervalControl
        summary={summary}
        onApply={vi.fn()}
        isSaving={false}
        errorMessage="Invalid interval. Enter a value between 1 and 300 seconds."
      />,
    )

    fireEvent.change(screen.getByLabelText(/sampling interval/i), {
      target: { value: '60' },
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid interval/i)
  })
})
