/** Formats a raw sensor value to 2 decimals for display (the DB stores full float precision). */
export function formatReadingValue(value: number): string {
  return value.toFixed(2)
}
