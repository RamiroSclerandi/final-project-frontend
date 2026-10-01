import { describe, expect, it } from 'vitest'

import {
  SamplingIntervalRequestError,
  toSafeSamplingIntervalErrorKey,
} from './setIntervalError'

describe('toSafeSamplingIntervalErrorKey', () => {
  it('reports an invalid interval for a 400 response', () => {
    expect(
      toSafeSamplingIntervalErrorKey(new SamplingIntervalRequestError(400)),
    ).toBe('config.error.invalidInterval')
  })

  it('reports a 502 as saved but not delivered to the device', () => {
    expect(
      toSafeSamplingIntervalErrorKey(new SamplingIntervalRequestError(502)),
    ).toBe('config.error.notDelivered')
  })

  it('falls back to a generic message for any other status', () => {
    expect(
      toSafeSamplingIntervalErrorKey(new SamplingIntervalRequestError(500)),
    ).toBe('config.error.generic')
  })

  it('falls back to a generic message for a non-request error, never echoing it', () => {
    expect(toSafeSamplingIntervalErrorKey(new Error('raw db detail'))).toBe(
      'config.error.generic',
    )
  })
})
