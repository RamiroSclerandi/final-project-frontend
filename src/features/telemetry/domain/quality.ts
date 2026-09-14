export type ReadingQuality = 'ok' | 'out_of_range' | 'suspect'

/**
 * Normalises a raw `measurements.quality` string to the domain enum,
 * defaulting an unrecognised value to `ok` rather than failing.
 */
export function normalizeQuality(value: string): ReadingQuality {
  return value === 'out_of_range' || value === 'suspect' ? value : 'ok'
}
