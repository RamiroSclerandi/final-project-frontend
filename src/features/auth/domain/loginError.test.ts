import { describe, expect, it } from 'vitest'

import { toSafeLoginErrorMessage } from './loginError'

describe('toSafeLoginErrorMessage', () => {
  it('returns a generic message for invalid-credentials errors', () => {
    expect(
      toSafeLoginErrorMessage(new Error('Invalid login credentials')),
    ).toBe('Invalid email or password.')
  })

  it('returns the same generic message for a network failure', () => {
    expect(toSafeLoginErrorMessage(new Error('fetch failed'))).toBe(
      'Invalid email or password.',
    )
  })

  it('returns the same generic message for a non-Error value', () => {
    expect(toSafeLoginErrorMessage('unexpected string')).toBe(
      'Invalid email or password.',
    )
  })

  it('never includes the original error text in the returned message', () => {
    const secretDetail = 'user with email x@y.com does not exist'

    expect(toSafeLoginErrorMessage(new Error(secretDetail))).not.toContain(
      secretDetail,
    )
  })
})
