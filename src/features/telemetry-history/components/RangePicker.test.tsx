import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    render(
      <RangePicker
        from={new Date('2026-09-14T12:00:00Z')}
        to={NOW}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /24 hours/i }))

    expect(onChange).toHaveBeenCalledWith({
      from: new Date('2026-09-14T12:00:00Z'),
      to: NOW,
    })
  })

  it('shows the granularity the current range resolves to', () => {
    render(
      <RangePicker
        from={new Date('2026-09-08T12:00:00Z')}
        to={NOW}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/granularity: hourly/i)).toBeInTheDocument()
  })

  it('emits a new range when the custom "from" input changes', () => {
    const onChange = vi.fn()
    render(
      <RangePicker
        from={new Date('2026-09-14T12:00:00Z')}
        to={NOW}
        onChange={onChange}
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
    render(<RangePicker from={from} to={NOW} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText(/^to$/i), {
      target: { value: '2026-09-15T06:00' },
    })

    expect(onChange).toHaveBeenCalledWith({
      from,
      to: new Date('2026-09-15T06:00'),
    })
  })
})
