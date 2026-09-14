import { describe, expect, it } from 'vitest'

import { toRealtimeStatus } from './connectionStatus'

describe('toRealtimeStatus', () => {
  it('maps SUBSCRIBED to live', () => {
    expect(toRealtimeStatus('SUBSCRIBED')).toBe('live')
  })

  it('maps TIMED_OUT and CHANNEL_ERROR to reconnecting', () => {
    expect(toRealtimeStatus('TIMED_OUT')).toBe('reconnecting')
    expect(toRealtimeStatus('CHANNEL_ERROR')).toBe('reconnecting')
  })

  it('maps CLOSED to down', () => {
    expect(toRealtimeStatus('CLOSED')).toBe('down')
  })

  it('falls back to connecting for an unrecognised status', () => {
    expect(toRealtimeStatus('anything-else')).toBe('connecting')
  })
})
