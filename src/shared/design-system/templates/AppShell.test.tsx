import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppNav, AppShell } from './AppShell'

function renderShell() {
  return render(
    <MemoryRouter>
      <AppShell
        brand={<span>Fleet Monitor</span>}
        tenantSwitcher={<span>UNRaf</span>}
        topBarActions={<button type="button">Log out</button>}
        nav={<nav aria-label="Main navigation">nav stub</nav>}
        skipLinkLabel="Skip to content"
      >
        <p>Route content</p>
      </AppShell>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('renders exactly one main landmark with id="main" (REQ-SHELL-1)', () => {
    renderShell()

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })

  it('renders the skip link as the first focusable element, targeting #main (REQ-SHELL-1)', () => {
    renderShell()

    const focusable = document.body.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    )

    expect(focusable[0]).toHaveAttribute('href', '#main')
    expect(focusable[0]).toHaveTextContent('Skip to content')
  })

  it('exposes header, nav, and main as its structural landmarks', () => {
    renderShell()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders the given slots inside the header and main content areas', () => {
    renderShell()

    expect(screen.getByText('Fleet Monitor')).toBeInTheDocument()
    expect(screen.getByText('UNRaf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(screen.getByText('Route content')).toBeInTheDocument()
  })

  // Found in the 360 px browser check: brand, tenant, toggles and logout on
  // one unwrappable row measured 550 px. jsdom cannot lay out, so this pins
  // the wrapping and shrink classes the fix relies on (REQ-MOBILE-1).
  it('lets the header wrap and its brand group shrink so 360 px never scrolls sideways', () => {
    renderShell()

    const header = screen.getByRole('banner')
    expect(header).toHaveClass('flex-wrap')
    expect(screen.getByText('UNRaf').parentElement).toHaveClass('min-w-0')
  })
})

describe('AppNav', () => {
  it('renders a navigation landmark with a link per item, marking the current route active', () => {
    render(
      <MemoryRouter initialEntries={['/alerts']}>
        <AppNav
          ariaLabel="Main navigation"
          items={[
            { to: '/', label: 'Fleet' },
            { to: '/alerts', label: 'Alerts' },
            { to: '/admin', label: 'Admin' },
          ]}
        />
      </MemoryRouter>,
    )

    const alertsLink = screen.getByRole('link', { name: 'Alerts' })
    expect(alertsLink).toHaveAttribute('href', '/alerts')
    expect(alertsLink).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Fleet' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
