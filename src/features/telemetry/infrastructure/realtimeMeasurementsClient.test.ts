import { describe, expect, it, vi } from 'vitest'

import {
  subscribeToMeasurementInserts,
  unsubscribeFromMeasurements,
} from './realtimeMeasurementsClient'

const supabaseFake = vi.hoisted(() => {
  // Mirrors realtime-js: channel(topic) returns the registered channel for a
  // topic, and removeChannel only unregisters it asynchronously.
  const channels = new Map<string, object>()
  const createChannel = (topic: string) => {
    const channel = {
      topic,
      on: () => channel,
      subscribe: () => channel,
    }
    return channel
  }
  return {
    channel: (topic: string) => {
      const existing = channels.get(topic)
      if (existing) return existing
      const created = createChannel(topic)
      channels.set(topic, created)
      return created
    },
    removeChannel: () => new Promise(() => {}),
  }
})

vi.mock('../../../shared/api/supabase', () => ({ supabase: supabaseFake }))

const handlers = { onInsert: () => {}, onStatusChange: () => {} }

describe('subscribeToMeasurementInserts', () => {
  it('opens a fresh channel when remounted before the previous one finished leaving', () => {
    const first = subscribeToMeasurementInserts(handlers)
    unsubscribeFromMeasurements(first)

    const second = subscribeToMeasurementInserts(handlers)

    expect(second).not.toBe(first)
  })
})
