import { describe, expect, it, vi } from 'vitest'

import {
  subscribeToSensorInserts,
  unsubscribeFromSensorInserts,
} from './liveMeasurementsClient'

type Handler = (payload: { new: unknown }) => void

const supabaseFake = vi.hoisted(() => {
  // Mirrors realtime-js: channel(topic) returns the registered channel for a
  // topic, and the server only delivers rows matching the channel's filter.
  const channels = new Map<
    string,
    {
      filter?: string
      handler?: Handler
      on: (
        type: string,
        options: { filter?: string },
        handler: Handler,
      ) => unknown
      subscribe: (callback: (status: string) => void) => unknown
      statusCallback?: (status: string) => void
    }
  >()
  return {
    channels,
    channel: (topic: string) => {
      const existing = channels.get(topic)
      if (existing) return existing
      const created: typeof channels extends Map<string, infer C> ? C : never =
        {
          on: (_type, options, handler) => {
            created.filter = options.filter
            created.handler = handler
            return created
          },
          subscribe: (callback) => {
            created.statusCallback = callback
            return created
          },
        }
      channels.set(topic, created)
      return created
    },
    removeChannel: () => new Promise(() => {}),
  }
})

vi.mock('../../../shared/api/supabase', () => ({ supabase: supabaseFake }))

const SENSOR_ID = '0b5f6c1e-2d3a-4b5c-8d9e-0f1a2b3c4d5e'

describe('subscribeToSensorInserts', () => {
  it("delivers the sensor's inserts and maps channel states to live/down", () => {
    const onInsert = vi.fn()
    const onStatusChange = vi.fn()

    const channel = subscribeToSensorInserts(SENSOR_ID, {
      onInsert,
      onStatusChange,
    })
    const registered = [...supabaseFake.channels.values()].at(-1)
    registered?.handler?.({ new: { id: 1, sensor_id: SENSOR_ID } })
    registered?.statusCallback?.('SUBSCRIBED')
    registered?.statusCallback?.('CHANNEL_ERROR')

    expect(channel).not.toBeNull()
    expect(registered?.filter).toBe(`sensor_id=eq.${SENSOR_ID}`)
    expect(onInsert).toHaveBeenCalledWith({ id: 1, sensor_id: SENSOR_ID })
    expect(onStatusChange.mock.calls).toEqual([['live'], ['down']])
  })

  it('opens a fresh channel when remounted before the previous one finished leaving', () => {
    const handlers = { onInsert: () => {}, onStatusChange: () => {} }
    const first = subscribeToSensorInserts(SENSOR_ID, handlers)
    if (first) unsubscribeFromSensorInserts(first)

    const second = subscribeToSensorInserts(SENSOR_ID, handlers)

    expect(second).not.toBe(first)
  })

  it('refuses to build a filter from something that is not a sensor id', () => {
    const before = supabaseFake.channels.size

    const channel = subscribeToSensorInserts('x,sensor_id=neq.0', {
      onInsert: () => {},
      onStatusChange: () => {},
    })

    expect(channel).toBeNull()
    expect(supabaseFake.channels.size).toBe(before)
  })
})
