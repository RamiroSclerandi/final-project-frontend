/**
 * Structural input/output types for the node view-model (D-1: this domain
 * imports nothing outside `shared/lib`, so every input here is declared
 * locally rather than imported from `telemetry` -- that feature's real
 * `LatestReading` satisfies this shape structurally, same pattern as
 * fleet's `fleetNode.ts`).
 */
export interface NodeReadingInput {
  sensorId: string
  channel: string
  unit: string
  value: number
  quality: string
  timestamp: string
  sensorTag: string
  sensorLabel: string | null
  rssi: number | null
}

export interface SensorPhase {
  tag: string
  sensorId: string
  label: string | null
  value: number
  quality: string
  timestamp: string
}

export interface SensorChannelGroup {
  channel: string
  unit: string
  phases: SensorPhase[]
}
