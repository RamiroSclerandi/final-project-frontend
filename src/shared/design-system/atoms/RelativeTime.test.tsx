import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../test/renderWithProviders'
import { RelativeTime } from './RelativeTime'

const NOW = new Date('2026-01-01T12:00:00.000Z').getTime()

describe('RelativeTime', () => {
  it('renders a <time> element carrying the raw ISO timestamp', () => {
    const iso = new Date(NOW - 5 * 60_000).toISOString()
    renderWithProviders(<RelativeTime iso={iso} nowMs={NOW} />)

    const time = screen.getByText('5 minutes ago')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('datetime', iso)
  })

  it('keeps advancing while mounted when the caller omits nowMs', () => {
    vi.useFakeTimers({ now: NOW })
    try {
      const iso = new Date(NOW - 60_000).toISOString()
      renderWithProviders(<RelativeTime iso={iso} />)

      act(() => vi.advanceTimersByTime(2 * 60_000))

      expect(screen.getByText('3 minutes ago')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a timestamp ahead of the local clock as now', () => {
    const iso = new Date(NOW + 2 * 60_000).toISOString()
    renderWithProviders(<RelativeTime iso={iso} nowMs={NOW} />)

    expect(screen.getByText('now')).toBeInTheDocument()
  })
})
