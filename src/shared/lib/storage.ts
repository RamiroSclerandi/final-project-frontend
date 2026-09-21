/**
 * Reads `key` from `localStorage`, tolerating a blocked storage API (e.g. a
 * browser "block all site data" setting throws `SecurityError` on access).
 * Persistence is best-effort, never fatal -- a real bug (anything that is
 * not a `DOMException`) is rethrown, not swallowed.
 */
export function readStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    if (error instanceof DOMException) {
      return null
    }
    throw error
  }
}

/**
 * Writes `value` under `key` in `localStorage`, tolerating a blocked storage
 * API the same way `readStorageItem` does: a `DOMException` is swallowed
 * (persistence is best-effort), any other error is rethrown as a real bug.
 */
export function writeStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    if (error instanceof DOMException) {
      return
    }
    throw error
  }
}
