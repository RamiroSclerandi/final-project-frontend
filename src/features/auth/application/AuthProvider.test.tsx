import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

const authClientMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
}))

vi.mock('../infrastructure/authClient', () => authClientMocks)

function createWrapper(queryClient = new QueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
}

describe('AuthProvider / useAuth', () => {
  let emitAuthChange: (session: unknown) => void

  beforeEach(() => {
    vi.resetAllMocks()
    authClientMocks.subscribeToAuthChanges.mockImplementation((callback) => {
      emitAuthChange = callback
      return { unsubscribe: vi.fn() }
    })
  })

  it('starts in a loading status before the first auth event', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.status).toBe('loading')
  })

  it('becomes unauthenticated when the initial session is null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    act(() => emitAuthChange(null))

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(result.current.session).toBeNull()
  })

  it('becomes authenticated and maps the session on a persisted session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    act(() =>
      emitAuthChange({
        user: { id: 'user-1', email: 'operator@example.com' },
      }),
    )

    await waitFor(() => expect(result.current.status).toBe('authenticated'))
    expect(result.current.session).toEqual({
      userId: 'user-1',
      email: 'operator@example.com',
    })
  })

  it('signIn resolves with a generic error message on rejected credentials', async () => {
    authClientMocks.signInWithPassword.mockResolvedValue({
      error: new Error('Invalid login credentials'),
    })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    const outcome = await act(() => result.current.signIn('a@b.com', 'wrong'))

    expect(outcome).toEqual({ error: 'Invalid email or password.' })
  })

  it('signIn resolves with no error on valid credentials', async () => {
    authClientMocks.signInWithPassword.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    const outcome = await act(() => result.current.signIn('a@b.com', 'right'))

    expect(outcome).toEqual({ error: null })
  })

  it('signOut delegates to the infrastructure signOut', async () => {
    authClientMocks.signOut.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(() => result.current.signOut())

    expect(authClientMocks.signOut).toHaveBeenCalledOnce()
  })

  it('drops cached data when the session ends', async () => {
    const queryClient = new QueryClient()
    renderHook(() => useAuth(), { wrapper: createWrapper(queryClient) })
    act(() =>
      emitAuthChange({ user: { id: 'user-1', email: 'operator@example.com' } }),
    )
    queryClient.setQueryData(['devices'], [{ id: 'device-1' }])

    act(() => emitAuthChange(null))

    await waitFor(() =>
      expect(queryClient.getQueryData(['devices'])).toBeUndefined(),
    )
  })
})
