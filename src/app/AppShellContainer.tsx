import { Link, Navigate, Outlet } from 'react-router-dom'

import { LogoutButtonContainer, useAuth } from '../features/auth'
import {
  AdminIcon,
  AlertsIcon,
  FleetIcon,
  TelemetryIcon,
} from '../shared/design-system/atoms/icons'
import { LocaleToggle } from '../shared/design-system/molecules/LocaleToggle'
import { TenantSwitcher } from '../shared/design-system/molecules/TenantSwitcher'
import { ThemeToggle } from '../shared/design-system/molecules/ThemeToggle'
import { AppNav, AppShell } from '../shared/design-system/templates/AppShell'
import { useTheme } from '../shared/design-system/theme/useTheme'
import { useTranslation } from '../shared/i18n/useTranslation'
import { deriveTenants } from './tenant'
import { RouteErrorBoundary } from './RouteErrorBoundary'

// Single-tenant today (decision #411): `TenantSwitcher` never renders a
// select with exactly one tenant, so this callback is unreachable until a
// second tenant exists.
function handleTenantChange() {}

/**
 * Owns session-to-tenant derivation, locale, and theme wiring for the app
 * shell; `AppShell` itself stays presentational. Rendered only behind
 * `RequireSession`, so a session is expected here. An authenticated status
 * with no session is an inconsistent auth state; sending the user back to
 * login always leaves them a way out, whereas an empty shell would not.
 */
export function AppShellContainer() {
  const { session } = useAuth()
  const { t, locale, setLocale } = useTranslation()
  const { theme, setTheme } = useTheme()

  const tenants = session ? deriveTenants(session) : []
  const currentTenant = tenants[0]

  if (!currentTenant) {
    return <Navigate to="/login" replace />
  }

  const navItems = [
    { to: '/', label: t('shell.nav.fleet'), icon: <FleetIcon /> },
    { to: '/alerts', label: t('shell.nav.alerts'), icon: <AlertsIcon /> },
    { to: '/admin', label: t('shell.nav.admin'), icon: <AdminIcon /> },
  ]

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <AppShell
      brand={
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-label text-text max-md:min-h-11 max-md:min-w-11 max-md:justify-center"
        >
          <span className="text-accent">
            <TelemetryIcon />
          </span>
          <span className="max-md:sr-only">{t('shell.brand')}</span>
        </Link>
      }
      tenantSwitcher={
        <TenantSwitcher
          tenants={tenants}
          current={currentTenant}
          onChange={handleTenantChange}
          label={t('shell.tenant.label')}
        />
      }
      topBarActions={
        <>
          <LocaleToggle locale={locale} onChange={setLocale} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <LogoutButtonContainer />
        </>
      }
      nav={<AppNav items={navItems} ariaLabel={t('shell.nav.label')} />}
      skipLinkLabel={t('shell.skipToContent')}
    >
      <RouteErrorBoundary>
        <Outlet />
      </RouteErrorBoundary>
    </AppShell>
  )
}
