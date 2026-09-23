/** Cache key for `useFleetSparklines` -- sensor and the 60-min window's floored end minute (D4). */
export function fleetSparklineQueryKey(
  sensorId: string,
  windowEndMinuteIso: string,
) {
  return ['fleetSparkline', sensorId, windowEndMinuteIso] as const
}
