export type RealtimeStatus = 'connecting' | 'live' | 'reconnecting' | 'down'

/**
 * Maps the Supabase Realtime subscribe status to the domain's connection
 * status (D-2). Takes a plain string instead of the SDK's
 * `REALTIME_SUBSCRIBE_STATES` enum so domain needs no `@supabase/supabase-js`
 * import.
 */
export function toRealtimeStatus(status: string): RealtimeStatus {
  switch (status) {
    case 'SUBSCRIBED':
      return 'live'
    case 'TIMED_OUT':
    case 'CHANNEL_ERROR':
      return 'reconnecting'
    case 'CLOSED':
      return 'down'
    default:
      return 'connecting'
  }
}
