const GENERIC_UPDATE_ERROR_MESSAGE = 'Could not save changes. Try again.'

/**
 * Maps any device/sensor update failure to one fixed, generic message --
 * PostgREST's raw error text (which can name a rejected column) is never
 * echoed to the user. Same pattern as auth's `toSafeLoginErrorMessage`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the input is deliberately ignored; every error maps to the same generic message
export function toSafeUpdateErrorMessage(_error: unknown): string {
  return GENERIC_UPDATE_ERROR_MESSAGE
}
