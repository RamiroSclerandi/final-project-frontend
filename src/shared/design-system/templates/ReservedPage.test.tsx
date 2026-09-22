import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ReservedPage } from './ReservedPage'

describe('ReservedPage', () => {
  it('labels its section from the title and shows the description (REQ-SHELL-2)', () => {
    render(
      <ReservedPage
        title="Alerts"
        description="Alerting is not available yet."
      />,
    )

    expect(screen.getByRole('region', { name: 'Alerts' })).toBeInTheDocument()
    expect(
      screen.getByText('Alerting is not available yet.'),
    ).toBeInTheDocument()
  })

  it('renders different content for a different title/description pair', () => {
    render(<ReservedPage title="Admin" description="Coming soon." />)

    expect(screen.getByRole('region', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon.')).toBeInTheDocument()
  })
})
