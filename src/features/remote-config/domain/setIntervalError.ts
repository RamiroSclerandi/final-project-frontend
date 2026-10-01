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

export type SamplingIntervalErrorKey =
  | 'config.error.invalidInterval'
  | 'config.error.notDelivered'
  | 'config.error.generic'

/**
 * Maps a failed request to one safe, specific message key -- the function's
 * raw error text is never echoed to the user. A 502 means the request was
 * saved but never reached the device; nothing retries it.
 */
export function toSafeSamplingIntervalErrorKey(
  error: unknown,
): SamplingIntervalErrorKey {
  if (!(error instanceof SamplingIntervalRequestError)) {
    return 'config.error.generic'
  }
  if (error.status === 400) {
    return 'config.error.invalidInterval'
  }
  if (error.status === 502) {
    return 'config.error.notDelivered'
  }
  return 'config.error.generic'
}
