import { buildCsv } from '../../../shared/lib/csv'

/**
 * Structural shape of one exported point -- matches telemetry-history's
 * `HistoricalPoint` without importing it: domain keeps zero imports outside
 * `shared/lib`, including across feature boundaries (D-1).
 */
export interface ExportPoint {
  t: string
  value: number
  quality?: string
  tsSource?: string
  min?: number
  max?: number
  sampleCount?: number
}

const HEADER = [
  'sensor_id',
  'timestamp',
  'value',
  'quality',
  'ts_source',
  'value_min',
  'value_max',
  'sample_count',
]

function toRow(sensorId: string, point: ExportPoint): (string | number)[] {
  return [
    sensorId,
    point.t,
    point.value,
    point.quality ?? '',
    point.tsSource ?? '',
    point.min ?? '',
    point.max ?? '',
    point.sampleCount ?? '',
  ]
}

/** Serializes a historical series to CSV (REQ-DE-1): one row per point. */
export function toExportCsv(sensorId: string, points: ExportPoint[]): string {
  return buildCsv(
    HEADER,
    points.map((point) => toRow(sensorId, point)),
  )
}
