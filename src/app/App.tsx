import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../features/auth'
import { ThemeProvider } from '../shared/design-system/theme/ThemeProvider'
import { I18nProvider } from '../shared/i18n/I18nProvider'
import { DashboardPage } from '../pages/DashboardPage'
import { DevicesPage } from '../pages/DevicesPage'
import { HistoryPage } from '../pages/HistoryPage'
import { LoginPage } from '../pages/LoginPage'
import { RequireSession } from './RequireSession'

const queryClient = new QueryClient()

/**
 * Composition root: wires the query client, auth, locale, and theme
 * providers around the router (D-ui-redesign PR-1). Provider order is
 * `QueryClientProvider → AuthProvider → I18nProvider → ThemeProvider →
 * BrowserRouter`; routes are unchanged in this PR. `/login` is public,
 * every other route is gated by `RequireSession`.
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
                  path="/"
                  element={
                    <RequireSession>
                      <DashboardPage />
                    </RequireSession>
                  }
                />
                <Route
                  path="/history/:sensorId"
                  element={
                    <RequireSession>
                      <HistoryPage />
                    </RequireSession>
                  }
                />
                <Route
                  path="/devices"
                  element={
                    <RequireSession>
                      <DevicesPage />
                    </RequireSession>
                  }
                />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
