import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

const authClientMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
}))

vi.mock('../infrastructure/authClient', () => authClientMocks)

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
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    expect(result.current.status).toBe('loading')
  })

  it('becomes unauthenticated when the initial session is null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    act(() => emitAuthChange(null))

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(result.current.session).toBeNull()
  })

  it('becomes authenticated and maps the session on a persisted session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

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
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    const outcome = await act(() => result.current.signIn('a@b.com', 'wrong'))

    expect(outcome).toEqual({ error: 'Invalid email or password.' })
  })

  it('signIn resolves with no error on valid credentials', async () => {
    authClientMocks.signInWithPassword.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    const outcome = await act(() => result.current.signIn('a@b.com', 'right'))

    expect(outcome).toEqual({ error: null })
  })

  it('signOut delegates to the infrastructure signOut', async () => {
    authClientMocks.signOut.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await act(() => result.current.signOut())

    expect(authClientMocks.signOut).toHaveBeenCalledOnce()
  })
})
