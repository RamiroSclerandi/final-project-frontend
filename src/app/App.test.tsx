import { render, screen, within } from '@testing-library/react'
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'

const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('../features/auth/application/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../features/auth/application/useAuth', () => ({
  useAuth: useAuthMock,
}))
vi.mock('../features/fleet', () => ({
  FleetContainer: () => <p>Fleet nodes</p>,
}))
vi.mock('../features/telemetry-history', () => ({
  HistoryContainer: ({ sensorId }: { sensorId: string }) => (
    <p>History for {sensorId}</p>
  ),
  HistoryTitleContainer: () => <h1>Sensor history</h1>,
}))
vi.mock('../features/node', () => ({
  NodeContainer: ({ deviceId }: { deviceId: string }) => <p>Node {deviceId}</p>,
}))

const AUTHENTICATED_SESSION = {
  userId: 'user-1',
  email: 'operator@example.com',
}

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

/** A `<Route>`-shaped element's props this helper actually reads. */
interface RouteLikeProps {
  path?: string
  index?: boolean
  children?: ReactNode
}

function routeProps(element: ReactElement): RouteLikeProps {
  // Test-only introspection: `element.props` is typed `any` by React's own
  // types for a generic `ReactElement`, so this narrows it to the handful
  // of fields every `<Route>` in this tree actually uses.
  return element.props as RouteLikeProps
}

function resolveRoutePath(
  prefix: string,
  path: string | undefined,
  isIndex: boolean,
): string | null {
  if (isIndex) {
    return prefix === '' ? '/' : prefix
  }
  if (path === undefined) {
    return null
  }
  if (path.startsWith('/')) {
    return path
  }
  return `${prefix}/${path}`
}

function collectRoutePaths(node: ReactNode, prefix: string, paths: string[]) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) {
      return
    }
    const { path, index, children } = routeProps(child)
    const ownPath = resolveRoutePath(prefix, path, Boolean(index))
    if (ownPath !== null) {
      paths.push(ownPath)
    }
    if (children) {
      collectRoutePaths(children, ownPath ?? prefix, paths)
    }
  })
}

/**
 * Flattens `<App/>`'s configured route paths without rendering (REQ-SHELL-5).
 * `App` itself calls no hooks -- it only composes provider JSX -- so calling
 * it directly here is safe and lets this walk `.props.children` down to the
 * `<Route>` tree without ever invoking `AuthProvider`/`I18nProvider`/etc.
 */
function routesOf(appElement: ReactElement<Record<string, never>>): string[] {
  const paths: string[] = []
  const tree = (appElement.type as () => ReactNode)()
  collectRoutePaths(tree, '', paths)
  return paths
}

describe('App routes', () => {
  it('does not expose a /signup route (REQ-SHELL-5, REQ-AUTH-1)', () => {
    expect(routesOf(<App />)).not.toContain('/signup')
  })

  it('exposes the full REQ-SHELL-2 route tree', () => {
    expect(routesOf(<App />)).toEqual(
      expect.arrayContaining([
        '/login',
        '/',
        '/history/:sensorId',
        '/nodes/:id',
        '/nodes/:id/sensors/:sid',
        '/admin',
        '/alerts',
        '/*',
      ]),
    )
  })
})

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('redirects an unauthenticated visitor away from the dashboard route to login', () => {
    useAuthMock.mockReturnValue({
      status: 'unauthenticated',
      session: null,
      signIn: vi.fn(),
    })

    renderAppAt('/')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the fleet content with the shell chrome for an authenticated visitor', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signOut: vi.fn(),
    })

    renderAppAt('/')

    expect(screen.getByText('Fleet nodes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('renders the login form at /login', () => {
    useAuthMock.mockReturnValue({
      status: 'unauthenticated',
      session: null,
      signIn: vi.fn(),
    })

    renderAppAt('/login')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('redirects an unauthenticated visitor away from the history route', () => {
    useAuthMock.mockReturnValue({
      status: 'unauthenticated',
      session: null,
      signIn: vi.fn(),
    })

    renderAppAt('/history/sensor-1')

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders the history page for an authenticated visitor', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signOut: vi.fn(),
    })

    renderAppAt('/history/sensor-1')

    expect(screen.getByText('History for sensor-1')).toBeInTheDocument()
  })

  it('renders a reserved placeholder for /alerts (REQ-SHELL-2)', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signOut: vi.fn(),
    })

    renderAppAt('/alerts')

    expect(
      screen.getByText('Alerting is not available yet.'),
    ).toBeInTheDocument()
  })

  it('renders the node detail page for /nodes/:id (ui-redesign PR-6)', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signOut: vi.fn(),
    })

    renderAppAt('/nodes/device-1')

    expect(screen.getByText('Node device-1')).toBeInTheDocument()
  })

  it('renders a coming-soon placeholder for /nodes/:id/sensors/:sid (not implemented until PR-8)', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signOut: vi.fn(),
    })

    renderAppAt('/nodes/device-1/sensors/sensor-1')

    expect(
      screen.getByText('This view is not available yet.'),
    ).toBeInTheDocument()
  })

  it('redirects an unknown path to / (REQ-SHELL-2)', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signOut: vi.fn(),
    })

    renderAppAt('/this-route-does-not-exist')

    expect(screen.getByText('Fleet nodes')).toBeInTheDocument()
  })

  it('renders the shell navigation with links to Fleet, Alerts, and Admin', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      session: AUTHENTICATED_SESSION,
      signOut: vi.fn(),
    })

    renderAppAt('/')

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(nav).toBeInTheDocument()
    // Exact names, not a substring match: the shell's brand link also
    // renders "Fleet Monitor", which a loose /fleet/i regex would also match.
    expect(within(nav).getByRole('link', { name: 'Fleet' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(within(nav).getByRole('link', { name: 'Alerts' })).toHaveAttribute(
      'href',
      '/alerts',
    )
    expect(within(nav).getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })
})
