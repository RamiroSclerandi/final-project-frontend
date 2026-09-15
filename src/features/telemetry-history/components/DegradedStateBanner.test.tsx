import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DegradedStateBanner } from './DegradedStateBanner'

describe('DegradedStateBanner', () => {
  it('renders nothing when nothing is degraded', () => {
    const { container } = render(
      <DegradedStateBanner
        aggregationStale={false}
        newestPointPartial={false}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('warns when the aggregation is stale (D-7)', () => {
    render(<DegradedStateBanner aggregationStale newestPointPartial={false} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      /aggregated data is behind/i,
    )
  })

  it('warns when the newest point is still partial (D-7)', () => {
    render(<DegradedStateBanner aggregationStale={false} newestPointPartial />)
    expect(screen.getByRole('status')).toHaveTextContent(/provisional/i)
  })

  it('shows both warnings when both apply', () => {
    render(<DegradedStateBanner aggregationStale newestPointPartial />)
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })
})
