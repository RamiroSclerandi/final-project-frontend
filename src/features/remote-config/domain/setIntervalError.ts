/** Thrown by the infrastructure layer when set-sampling-interval responds with a non-2xx status. */
export class SamplingIntervalRequestError extends Error {
  readonly status: number | undefined

  constructor(status: number | undefined) {
    super(
      `set-sampling-interval request failed (status ${status ?? 'unknown'})`,
    )
    this.status = status
  }
}

const INVALID_INTERVAL_MESSAGE =
  'Invalid interval. Enter a value between 1 and 300 seconds.'
const BROKER_UNREACHABLE_MESSAGE =
  'Could not reach the device broker. The request was recorded and will be retried.'
const GENERIC_MESSAGE = 'Could not update the sampling interval. Try again.'

/**
 * Maps a failed request to one safe, specific message -- the function's raw
 * error text is never echoed to the user (same pattern as device-management's
 * `toSafeUpdateErrorMessage`).
 */
export function toSafeSamplingIntervalErrorMessage(error: unknown): string {
  if (!(error instanceof SamplingIntervalRequestError)) {
    return GENERIC_MESSAGE
  }
  if (error.status === 400) {
    return INVALID_INTERVAL_MESSAGE
  }
  if (error.status === 502) {
    return BROKER_UNREACHABLE_MESSAGE
  }
  return GENERIC_MESSAGE
}
