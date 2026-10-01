const UNIT_LABELS: Record<string, string> = {
  degC: '°C',
  pct: '%',
  none: '',
}

/** Display symbol for a `sensor_types.unit` code; unknown codes pass through. */
export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit
}
