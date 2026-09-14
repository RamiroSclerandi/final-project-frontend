import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '../../../shared/api/supabase'
import {
  toRealtimeStatus,
  type RealtimeStatus,
} from '../domain/connectionStatus'
import type { MeasurementInsertRow } from '../domain/reading'

const CHANNEL_NAME = 'measurements-live'

interface SubscribeOptions {
  onInsert: (row: MeasurementInsertRow) => void
  onStatusChange: (status: RealtimeStatus) => void
}

/**
 * Opens the single unfiltered measurements INSERT channel (D-2): no
 * server-side sensor_id filter, routing happens client-side in the caller.
 */
export function subscribeToMeasurementInserts({
  onInsert,
  onStatusChange,
}: SubscribeOptions): RealtimeChannel {
  return supabase
    .channel(CHANNEL_NAME)
    .on<MeasurementInsertRow>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'measurements' },
      (payload) => onInsert(payload.new),
    )
    .subscribe((status) => onStatusChange(toRealtimeStatus(status)))
}

export function unsubscribeFromMeasurements(channel: RealtimeChannel): void {
  void supabase.removeChannel(channel)
}
