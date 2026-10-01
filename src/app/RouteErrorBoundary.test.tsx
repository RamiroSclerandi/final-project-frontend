import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../shared/test/renderWithProviders'
import { RouteErrorBoundary } from './RouteErrorBoundary'

let shouldThrow = true

function FlakyView() {
  if (shouldThrow) {
    throw new Error('render failed')
  }
  return <p>View content</p>
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('replaces a crashed view with a recoverable message instead of a blank page', () => {
    renderWithProviders(
      <RouteErrorBoundary>
        <FlakyView />
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('This view failed to load')).toBeInTheDocument()
  })

  it('renders the view again after retry once the failure is gone', () => {
    renderWithProviders(
      <RouteErrorBoundary>
        <FlakyView />
      </RouteErrorBoundary>,
    )

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByText('View content')).toBeInTheDocument()
  })
})
