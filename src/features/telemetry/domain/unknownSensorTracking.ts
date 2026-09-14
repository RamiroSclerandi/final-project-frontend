export interface UnknownSensorTrackingResult {
  shouldInvalidate: boolean
  pending: ReadonlySet<string>
}

/**
 * CA-5 guard (REQ-RT-3): an unrecognised sensor_id requests exactly one
 * `['latestReadings']` invalidation while unresolved -- flagged once in
 * `pending`, not once per packet.
 */
export function trackUnknownSensor(
  known: ReadonlySet<string>,
  pending: ReadonlySet<string>,
  sensorId: string,
): UnknownSensorTrackingResult {
  if (known.has(sensorId) || pending.has(sensorId)) {
    return { shouldInvalidate: false, pending }
  }
  return { shouldInvalidate: true, pending: new Set(pending).add(sensorId) }
}

/** Drops ids from `pending` that are now present in `known`, once a refetch settles. */
export function resolvePendingSensors(
  pending: ReadonlySet<string>,
  known: ReadonlySet<string>,
): ReadonlySet<string> {
  const next = new Set(pending)
  for (const id of pending) {
    if (known.has(id)) {
      next.delete(id)
    }
  }
  return next
}
