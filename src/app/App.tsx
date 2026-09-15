import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../features/auth'
import { DashboardPage } from '../pages/DashboardPage'
import { DevicesPage } from '../pages/DevicesPage'
import { HistoryPage } from '../pages/HistoryPage'
import { LoginPage } from '../pages/LoginPage'
import { RequireSession } from './RequireSession'

const queryClient = new QueryClient()

/**
 * Composition root: wires the query client, auth provider, and router.
 * `/login` is public; every other route is gated by `RequireSession`.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  )
}
