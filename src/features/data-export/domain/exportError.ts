const GENERIC_EXPORT_ERROR_MESSAGE =
  'Could not export the selected range. Try again.'

/** Maps any export failure to one fixed, generic message (same pattern as auth's `toSafeLoginErrorMessage`). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the input is deliberately ignored; every error maps to the same generic message
export function toSafeExportErrorMessage(_error: unknown): string {
  return GENERIC_EXPORT_ERROR_MESSAGE
}
