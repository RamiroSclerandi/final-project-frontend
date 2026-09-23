import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { RangePicker } from './RangePicker'

const NOW = new Date('2026-09-15T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RangePicker', () => {
  it('emits a range ending now when a preset is picked', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <RangePicker
        from={new Date('2026-09-14T12:00:00Z')}
        to={NOW}
        onChange={onChange}
        granularity="auto"
        onGranularityChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /24 hours/i }))

    expect(onChange).toHaveBeenCalledWith({
      from: new Date('2026-09-14T12:00:00Z'),
      to: NOW,
    })
  })

  it('emits a new range when the custom "from" input changes', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <RangePicker
        from={new Date('2026-09-14T12:00:00Z')}
        to={NOW}
        onChange={onChange}
        granularity="auto"
        onGranularityChange={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/from/i), {
      target: { value: '2026-09-10T00:00' },
    })

    expect(onChange).toHaveBeenCalledWith({
      from: new Date('2026-09-10T00:00'),
      to: NOW,
    })
  })

  it('emits a new range when the custom "to" input changes', () => {
    const onChange = vi.fn()
    const from = new Date('2026-09-14T12:00:00Z')
    renderWithProviders(
      <RangePicker
        from={from}
        to={NOW}
        onChange={onChange}
        granularity="auto"
        onGranularityChange={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/^to$/i), {
      target: { value: '2026-09-15T06:00' },
    })

    expect(onChange).toHaveBeenCalledWith({
      from,
      to: new Date('2026-09-15T06:00'),
    })
  })

  it('calls onGranularityChange when a granularity is selected (REQ-SENSOR-2)', () => {
    const onGranularityChange = vi.fn()
    renderWithProviders(
      <RangePicker
        from={new Date('2026-09-08T12:00:00Z')}
        to={NOW}
        onChange={vi.fn()}
        granularity="auto"
        onGranularityChange={onGranularityChange}
      />,
    )

    fireEvent.change(screen.getByLabelText(/granularity/i), {
      target: { value: 'daily' },
    })

    expect(onGranularityChange).toHaveBeenCalledWith('daily')
  })

  it("shows the auto option's resolved label per chooseGranularity (REQ-SENSOR-2)", () => {
    renderWithProviders(
      <RangePicker
        from={new Date('2026-09-08T12:00:00Z')}
        to={NOW}
        onChange={vi.fn()}
        granularity="auto"
        onGranularityChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('option', { name: 'Auto (Hourly)' }),
    ).toBeInTheDocument()
  })
})
