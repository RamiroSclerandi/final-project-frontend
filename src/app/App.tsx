import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../features/auth'
import { ReservedPage } from '../shared/design-system/templates/ReservedPage'
import { ThemeProvider } from '../shared/design-system/theme/ThemeProvider'
import { I18nProvider } from '../shared/i18n/I18nProvider'
import { useTranslation } from '../shared/i18n/useTranslation'
import { AdminPage } from '../pages/AdminPage'
import { AlertsPage } from '../pages/AlertsPage'
import { FleetPage } from '../pages/FleetPage'
import { HistoryPage } from '../pages/HistoryPage'
import { LoginPage } from '../pages/LoginPage'
import { NodePage } from '../pages/NodePage'
import { AppShellContainer } from './AppShellContainer'
import { RequireSession } from './RequireSession'

const queryClient = new QueryClient()

/**
 * A stand-in for `/nodes/:id/sensors/:sid`, which doesn't have a real page
 * yet (Sensor ships in PR-8). Reuses the `ReservedPage` template directly
 * rather than a dedicated page file, since there is no page-specific
 * behavior to add yet.
 */
function ComingSoonPlaceholder() {
  const { t } = useTranslation()

  return (
    <ReservedPage
      title={t('reserved.comingSoon.title')}
      description={t('reserved.comingSoon.description')}
    />
  )
}

/**
 * Composition root: wires the query client, auth, locale, and theme
 * providers around the router. Provider order is `QueryClientProvider →
 * AuthProvider → I18nProvider → ThemeProvider → BrowserRouter`
 * (D-ui-redesign PR-1). `/login` is public; every other route sits behind
 * `RequireSession` and the app shell layout route (ui-redesign PR-3,
 * REQ-SHELL-2, REQ-SHELL-3).
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <RequireSession>
                      <AppShellContainer />
                    </RequireSession>
                  }
                >
                  <Route index element={<FleetPage />} />
                  <Route path="history/:sensorId" element={<HistoryPage />} />
                  <Route path="nodes/:id" element={<NodePage />} />
                  <Route
                    path="nodes/:id/sensors/:sid"
                    element={<ComingSoonPlaceholder />}
                  />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
