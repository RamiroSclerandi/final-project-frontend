import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DeviceConfigSummary } from '../domain/deviceConfig'
import { SamplingIntervalControl } from './SamplingIntervalControl'

const summary: DeviceConfigSummary = {
  deviceId: 'device-1',
  deviceName: 'Kitchen node',
  config: null,
}

describe('SamplingIntervalControl', () => {
  it('shows "Not configured" when there is no device_configs row yet', () => {
    render(
      <SamplingIntervalControl
        summary={summary}
        onApply={vi.fn()}
        isSaving={false}
        errorMessage={null}
      />,
    )

    expect(screen.getByText(/not configured/i)).toBeInTheDocument()
  })

  it('shows the requested value and time when a config row exists', () => {
    render(
      <SamplingIntervalControl
        summary={{
          ...summary,
          config: {
            samplingIntervalMs: 60000,
            requestedAt: '2026-09-15T12:00:00Z',
          },
        }}
        onApply={vi.fn()}
        isSaving={false}
        errorMessage={null}
      />,
    )

    expect(
      screen.getByText(/requested 60s at 2026-09-15T12:00:00Z/i),
    ).toBeInTheDocument()
    // Non-Requirement (spec remote-config): no applied_at confirmation UI.
    expect(screen.queryByText(/applied/i)).not.toBeInTheDocument()
  })

  it('applies the entered seconds, converted to milliseconds, within range (REQ-RC-2)', () => {
    const onApply = vi.fn()
    render(
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
    render(
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
    render(
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
    render(
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
