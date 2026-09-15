import { describe, expect, it } from 'vitest'

import {
  MAX_SAMPLING_INTERVAL_SECONDS,
  MIN_SAMPLING_INTERVAL_SECONDS,
  isSamplingIntervalMsInRange,
  samplingIntervalMsToSeconds,
  samplingIntervalSecondsToMs,
} from './samplingInterval'

describe('samplingIntervalSecondsToMs', () => {
  it('converts seconds to milliseconds', () => {
    expect(samplingIntervalSecondsToMs(60)).toBe(60000)
  })
})

describe('samplingIntervalMsToSeconds', () => {
  it('converts milliseconds to seconds', () => {
    expect(samplingIntervalMsToSeconds(60000)).toBe(60)
  })
})

describe('isSamplingIntervalMsInRange', () => {
  it('accepts the lower boundary, 1000ms (REQ-RC-2)', () => {
    expect(isSamplingIntervalMsInRange(1000)).toBe(true)
  })

  it('accepts the upper boundary, 300000ms (REQ-RC-2)', () => {
    expect(isSamplingIntervalMsInRange(300000)).toBe(true)
  })

  it('rejects one millisecond below the lower boundary', () => {
    expect(isSamplingIntervalMsInRange(999)).toBe(false)
  })

  it('rejects one millisecond above the upper boundary', () => {
    expect(isSamplingIntervalMsInRange(300001)).toBe(false)
  })

  it('rejects a non-integer value', () => {
    expect(isSamplingIntervalMsInRange(1000.5)).toBe(false)
  })
})

describe('range constants exposed in seconds', () => {
  it('matches the millisecond range converted to seconds', () => {
    expect(MIN_SAMPLING_INTERVAL_SECONDS).toBe(1)
    expect(MAX_SAMPLING_INTERVAL_SECONDS).toBe(300)
  })
})
