import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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

  it('falls back to the mount time when the caller omits nowMs', () => {
    const iso = new Date(Date.now() - 3 * 60_000).toISOString()
    renderWithProviders(<RelativeTime iso={iso} />)

    expect(screen.getByText('3 minutes ago')).toBeInTheDocument()
  })

  it('renders a future timestamp using the appropriate direction', () => {
    const iso = new Date(NOW + 2 * 3_600_000).toISOString()
    renderWithProviders(<RelativeTime iso={iso} nowMs={NOW} />)

    expect(screen.getByText('in 2 hours')).toBeInTheDocument()
  })
})
