export type ReadingQuality = 'ok' | 'out_of_range' | 'suspect'

/**
 * Same rule as telemetry's `normalizeQuality`, duplicated rather than
 * imported: domain keeps zero imports outside `shared/lib`, including across
 * feature boundaries (D-1).
 */
export function normalizeQuality(value: string): ReadingQuality {
  return value === 'out_of_range' || value === 'suspect' ? value : 'ok'
}
