import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '../../../shared/api/supabase'
import type { LiveMeasurementRow } from '../domain/liveSeries'

/** Channel health as the live chart needs it: only up or not. */
export type LiveChannelStatus = 'connecting' | 'live' | 'down'

const CHANNEL_NAME = 'sensor-history'

const SENSOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toLiveChannelStatus(status: string): LiveChannelStatus {
  switch (status) {
    case 'SUBSCRIBED':
      return 'live'
    case 'TIMED_OUT':
    case 'CHANNEL_ERROR':
    case 'CLOSED':
      return 'down'
    default:
      return 'connecting'
  }
}

interface SensorInsertHandlers {
  onInsert: (row: LiveMeasurementRow) => void
  onStatusChange: (status: LiveChannelStatus) => void
}

/**
 * F-10: INSERTs of one sensor's measurements, filtered server-side. The
 * topic is unique per call because realtime-js reuses the channel of a known
 * topic while its async removal is still pending (X-3). Returns `null` for a
 * value that is not a sensor uuid, so a route param never shapes the filter.
 */
export function subscribeToSensorInserts(
  sensorId: string,
  { onInsert, onStatusChange }: SensorInsertHandlers,
): RealtimeChannel | null {
  if (!SENSOR_ID_PATTERN.test(sensorId)) {
    return null
  }
  return supabase
    .channel(`${CHANNEL_NAME}-${sensorId}-${crypto.randomUUID()}`)
    .on<LiveMeasurementRow>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'measurements',
        filter: `sensor_id=eq.${sensorId}`,
      },
      (payload) => onInsert(payload.new),
    )
    .subscribe((status) => onStatusChange(toLiveChannelStatus(status)))
}

export function unsubscribeFromSensorInserts(channel: RealtimeChannel): void {
  void supabase.removeChannel(channel)
}
