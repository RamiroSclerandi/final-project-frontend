import { describe, expect, it } from 'vitest'

import {
  SamplingIntervalRequestError,
  toSafeSamplingIntervalErrorMessage,
} from './setIntervalError'

describe('toSafeSamplingIntervalErrorMessage', () => {
  it('reports an invalid interval for a 400 response', () => {
    expect(
      toSafeSamplingIntervalErrorMessage(new SamplingIntervalRequestError(400)),
    ).toMatch(/invalid/i)
  })

  it('reports the broker as unreachable for a 502 response, noting the request was recorded', () => {
    expect(
      toSafeSamplingIntervalErrorMessage(new SamplingIntervalRequestError(502)),
    ).toMatch(/broker.*recorded/i)
  })

  it('falls back to a generic message for any other status', () => {
    expect(
      toSafeSamplingIntervalErrorMessage(new SamplingIntervalRequestError(500)),
    ).toBe('Could not update the sampling interval. Try again.')
  })

  it('falls back to a generic message for a non-request error, never echoing it', () => {
    expect(toSafeSamplingIntervalErrorMessage(new Error('raw db detail'))).toBe(
      'Could not update the sampling interval. Try again.',
    )
  })
})
