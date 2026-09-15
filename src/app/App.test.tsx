import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'

const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('../features/auth/application/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../features/auth/application/useAuth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('../features/telemetry', () => ({
  LiveDashboardContainer: () => <p>Live dashboard</p>,
}))
vi.mock('../features/node-health', () => ({
  NodeHealthContainer: () => <p>Node health</p>,
}))
vi.mock('../features/telemetry-history', () => ({
  HistoryContainer: ({ sensorId }: { sensorId: string }) => (
    <p>History for {sensorId}</p>
  ),
  HistoryTitleContainer: () => <h1>Sensor history</h1>,
}))
vi.mock('../features/device-management', () => ({
  DeviceManagementContainer: () => <p>Device management</p>,
}))
vi.mock('../features/remote-config', () => ({
  RemoteConfigContainer: () => <p>Remote config</p>,
}))

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('redirects an unauthenticated visitor away from the dashboard route to login', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated', signIn: vi.fn() })

    renderAppAt('/')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the dashboard with a logout action for an authenticated visitor', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated', signOut: vi.fn() })

    renderAppAt('/')

    expect(
      screen.getByRole('heading', { name: /dashboard/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('renders the login form at /login', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated', signIn: vi.fn() })

    renderAppAt('/login')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('redirects an unauthenticated visitor away from the history route', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated', signIn: vi.fn() })

    renderAppAt('/history/sensor-1')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders the history page for an authenticated visitor', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated', signOut: vi.fn() })

    renderAppAt('/history/sensor-1')

    expect(screen.getByText('History for sensor-1')).toBeInTheDocument()
  })

  it('redirects an unauthenticated visitor away from the devices route', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated', signIn: vi.fn() })

    renderAppAt('/devices')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders the devices page for an authenticated visitor (CA-3)', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated', signOut: vi.fn() })

    renderAppAt('/devices')

    expect(screen.getByText('Device management')).toBeInTheDocument()
  })

  it('links from the dashboard to device management', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated', signOut: vi.fn() })

    renderAppAt('/')

    expect(
      screen.getByRole('link', { name: /manage devices/i }),
    ).toHaveAttribute('href', '/devices')
  })
})
