import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { App } from './App'

type InsertHandler = (payload: { new: unknown }) => void

const realtimeFake = vi.hoisted(() => {
  // Mirrors realtime-js: channel(topic) hands back the channel registered for
  // that topic, and removeChannel only starts an async leave. A leaving channel
  // never delivers again, even if a later mount subscribes to it (X-3).
  interface FakeChannel {
    handlers: InsertHandler[]
    isLeaving: boolean
    on: (
      type: string,
      filter: { table?: string },
      handler: InsertHandler,
    ) => FakeChannel
    subscribe: (callback?: (status: string) => void) => FakeChannel
  }
  const channelsByTopic = new Map<string, FakeChannel>()
  const createChannel = (): FakeChannel => {
    const channel: FakeChannel = {
      handlers: [],
      isLeaving: false,
      on: (_type, filter, handler) => {
        if (filter.table === 'measurements') channel.handlers.push(handler)
        return channel
      },
      subscribe: (callback) => {
        if (!channel.isLeaving) callback?.('SUBSCRIBED')
        return channel
      },
    }
    return channel
  }
  return {
    supabase: {
      channel: (topic: string) => {
        const existing = channelsByTopic.get(topic)
        if (existing) return existing
        const created = createChannel()
        channelsByTopic.set(topic, created)
        return created
      },
      removeChannel: (channel: FakeChannel) => {
        channel.isLeaving = true
        return new Promise(() => {})
      },
    },
    emitMeasurementInsert: (row: unknown) => {
      for (const channel of channelsByTopic.values()) {
        if (channel.isLeaving) continue
        for (const handler of channel.handlers) handler({ new: row })
      }
    },
  }
})

const DEVICE = {
  id: 'device-a',
  name: 'Greenhouse A',
  macAddress: 'AABBCCDDEEFF',
  locationRef: 'Row 1',
  transport: 'wifi-mqtt',
  provisioned: true,
  firmwareVersion: '1.2.0',
  sensors: [],
}

const LATEST_READING = {
  sensorId: 'sensor-temp',
  deviceId: DEVICE.id,
  value: 21.5,
  timestamp: new Date().toISOString(),
  quality: 'ok',
  channel: 'temperature',
  unit: 'degC',
  sensorLabel: null,
  sensorTag: 'T1',
  deviceName: DEVICE.name,
  rssi: -60,
}

vi.mock('../shared/api/supabase', () => ({ supabase: realtimeFake.supabase }))
vi.mock('../features/auth/application/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../features/auth/application/useAuth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    session: { userId: 'user-1', email: 'operator@example.com' },
    signOut: vi.fn(),
  }),
}))
vi.mock('../features/device-management', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useDevices: () => ({
    data: [DEVICE],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))
vi.mock('../features/node-health', () => ({
  useDeviceStatuses: () => ({
    data: { [DEVICE.id]: { online: true, lastSeen: new Date().toISOString() } },
    isError: false,
    refetch: vi.fn(),
  }),
  useRealtimeDeviceStatuses: () => undefined,
}))
vi.mock('../features/remote-config', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSamplingIntervals: () => ({}),
}))
vi.mock(
  '../features/telemetry-history/infrastructure/historyRepository',
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    fetchRawMeasurements: () => Promise.resolve([]),
  }),
)
vi.mock('../features/telemetry/infrastructure/latestReadingsClient', () => ({
  fetchLatestReadings: () => Promise.resolve([LATEST_READING]),
}))

describe('Realtime across route changes', () => {
  it('keeps delivering live readings after navigating Fleet -> Node -> Fleet', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    await screen.findByText(/21\.5/)
    fireEvent.click(screen.getByRole('link', { name: DEVICE.name }))
    await screen.findByRole('heading', { level: 1, name: DEVICE.name })
    const nav = screen.getByRole('navigation')
    fireEvent.click(within(nav).getByRole('link', { name: 'Fleet' }))
    await screen.findByRole('link', { name: DEVICE.name })

    act(() => {
      realtimeFake.emitMeasurementInsert({
        sensor_id: LATEST_READING.sensorId,
        value: 23.4,
        timestamp: new Date(Date.now() + 1000).toISOString(),
        quality: 'ok',
      })
    })

    expect(await screen.findByText(/23\.4/)).toBeInTheDocument()
  })
})
