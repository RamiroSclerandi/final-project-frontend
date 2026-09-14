import { describe, expect, it } from 'vitest'

import {
  resolvePendingSensors,
  trackUnknownSensor,
} from './unknownSensorTracking'

describe('trackUnknownSensor', () => {
  it('flags an unrecognised sensor and requests one invalidation (REQ-RT-3)', () => {
    const result = trackUnknownSensor(
      new Set(['sensor-a']),
      new Set(),
      'sensor-x',
    )

    expect(result.shouldInvalidate).toBe(true)
    expect(result.pending.has('sensor-x')).toBe(true)
  })

  it('does not re-invalidate a still-unresolved sensor (REQ-RT-3 guard)', () => {
    const pending = new Set(['sensor-x'])

    const result = trackUnknownSensor(
      new Set(['sensor-a']),
      pending,
      'sensor-x',
    )

    expect(result.shouldInvalidate).toBe(false)
    expect(result.pending).toBe(pending)
  })

  it('does not invalidate a sensor already known', () => {
    const result = trackUnknownSensor(
      new Set(['sensor-a']),
      new Set(),
      'sensor-a',
    )

    expect(result.shouldInvalidate).toBe(false)
  })
})

describe('resolvePendingSensors', () => {
  it('drops ids that have become known, keeps ids still unresolved', () => {
    const pending = new Set(['sensor-x', 'sensor-y'])

    const result = resolvePendingSensors(pending, new Set(['sensor-x']))

    expect(result.has('sensor-x')).toBe(false)
    expect(result.has('sensor-y')).toBe(true)
  })
})
