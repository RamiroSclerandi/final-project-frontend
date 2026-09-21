import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title and body', () => {
    render(
      <EmptyState
        title="No nodes yet"
        body="Provision a device to see it here."
      />,
    )

    expect(screen.getByText('No nodes yet')).toBeInTheDocument()
    expect(
      screen.getByText('Provision a device to see it here.'),
    ).toBeInTheDocument()
  })

  it('renders the optional action when provided', () => {
    render(
      <EmptyState
        title="No nodes yet"
        body="Provision a device to see it here."
        action={<button type="button">Retry</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
