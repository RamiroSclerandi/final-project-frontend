import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ConnectionStatusBadge } from './ConnectionStatusBadge'

describe('ConnectionStatusBadge', () => {
  it('shows a live label when the channel is subscribed', () => {
    render(<ConnectionStatusBadge status="live" />)

    expect(screen.getByRole('status')).toHaveTextContent(/live/i)
  })

  it.each([
    ['connecting', /connecting/i],
    ['reconnecting', /reconnecting/i],
    ['down', /disconnected/i],
  ] as const)('shows a degraded label for %s', (status, expected) => {
    render(<ConnectionStatusBadge status={status} />)

    expect(screen.getByRole('status')).toHaveTextContent(expected)
  })
})
