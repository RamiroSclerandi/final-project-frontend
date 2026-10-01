import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '../../../shared/api/supabase'
import type { DeviceStatusRow } from '../domain/deviceStatus'

const CHANNEL_NAME = 'devices-live'

// realtime-js hands back the registered channel for a known topic, and removal
// is async: a fixed topic reuses a channel still leaving after navigation (X-3).
const uniqueTopic = () => `${CHANNEL_NAME}-${crypto.randomUUID()}`

interface SubscribeOptions {
  onUpdate: (row: DeviceStatusRow) => void
}

/**
 * Subscribes to `devices` UPDATE (REQ-NH-1, D-7): the worker's MQTT Last
 * Will flips `status` server-side, and this channel is the same
 * unfiltered-publication pattern as `realtimeMeasurementsClient` -- one
 * channel, no per-component subscriptions.
 */
export function subscribeToDeviceUpdates({
  onUpdate,
}: SubscribeOptions): RealtimeChannel {
  return supabase
    .channel(uniqueTopic())
    .on<DeviceStatusRow>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'devices' },
      (payload) => onUpdate(payload.new),
    )
    .subscribe()
}

export function unsubscribeFromDevices(channel: RealtimeChannel): void {
  void supabase.removeChannel(channel)
}
