import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export interface AppShellProps {
  brand: ReactNode
  tenantSwitcher: ReactNode
  topBarActions: ReactNode
  nav: ReactNode
  skipLinkLabel: string
  children: ReactNode
}

/**
 * Presentational app shell (REQ-SHELL-1): a skip link is the first
 * focusable element and targets `#main`; `header`/`nav`/`main` are the only
 * structural landmarks. All app-specific wiring (session, i18n, theme)
 * lives in `AppShellContainer` -- this template only arranges slots.
 */
export function AppShell({
  brand,
  tenantSwitcher,
  topBarActions,
  nav,
  skipLinkLabel,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-text"
      >
        {skipLinkLabel}
      </a>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          {brand}
          {tenantSwitcher}
        </div>
        <div className="flex flex-wrap items-center gap-2">{topBarActions}</div>
      </header>
      <div className="lg:grid lg:grid-cols-[14rem_1fr]">
        {nav}
        <main id="main" tabIndex={-1} className="min-w-0 pb-16 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export interface AppNavItem {
  to: string
  label: string
}

export interface AppNavProps {
  items: AppNavItem[]
  ariaLabel: string
}

/**
 * Bottom bar below `lg:`, left rail from `lg:` up -- CSS-only
 * responsiveness (REQ-MOBILE-2). `NavLink` sets `aria-current="page"` on the
 * active item natively.
 */
export function AppNav({ items, ariaLabel }: AppNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around border-t border-border bg-surface lg:static lg:z-auto lg:flex-col lg:justify-start lg:border-r lg:border-t-0 lg:bg-transparent lg:p-4"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className="flex min-h-11 flex-1 items-center justify-center px-2 text-sm text-text-muted aria-[current=page]:font-semibold aria-[current=page]:text-accent lg:flex-none lg:justify-start lg:px-3 lg:py-2"
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
