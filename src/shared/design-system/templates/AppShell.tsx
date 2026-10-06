import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export interface AppShellProps {
  brand: ReactNode
  /** Rendered as-is: the slot owns its own responsive visibility and must stay reachable on mobile when interactive. */
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
      <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 md:min-h-12 md:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {brand}
          {tenantSwitcher}
        </div>
        <div className="flex shrink-0 items-center gap-1">{topBarActions}</div>
      </header>
      <div className="lg:grid lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[14rem_1fr]">
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
  icon?: ReactNode
}

export interface AppNavProps {
  items: AppNavItem[]
  ariaLabel: string
}

/**
 * Bottom bar (icon above label) below `lg:`, left rail (icon beside label) from `lg:` up -- CSS-only
 * responsiveness (REQ-MOBILE-2). `NavLink` sets `aria-current="page"` on the
 * active item natively.
 */
export function AppNav({ items, ariaLabel }: AppNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around border-t border-border bg-surface lg:static lg:z-auto lg:flex-col lg:justify-start lg:gap-1 lg:border-r lg:border-t-0 lg:p-3"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-sm border-transparent px-2 text-2xs font-medium uppercase tracking-label text-text-muted hover:text-text aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent lg:min-h-9 lg:flex-none lg:flex-row lg:justify-start lg:gap-2.5 lg:border-l-2 lg:px-3 lg:text-xs aria-[current=page]:lg:border-accent"
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
