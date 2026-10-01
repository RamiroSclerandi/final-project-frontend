/**
 * Structural input/output types for the fleet view-model (D-1: this domain
 * imports nothing outside `shared/lib`, so every input here is declared
 * locally rather than imported from `device-management`/`node-health`/
 * `telemetry` -- those features' real types satisfy these shapes structurally).
 */
import type { NodeStatus } from '../../../shared/lib/nodeStatus'

export type { NodeStatus }

/** Matches `device-management`'s `Device` (id/name/locationRef/transport subset). */
export interface FleetDeviceInput {
  id: string
  name: string
  locationRef: string | null
  transport: string
}

/** Matches `node-health`'s `DeviceStatus` (online/lastSeen subset). */
export interface FleetStatusInput {
  online: boolean
  lastSeen: string | null
}

/** Matches `telemetry`'s `LatestReading` (D1 additive `deviceId`/`sensorTag` included). */
export interface FleetReadingInput {
  sensorId: string
  deviceId: string
  channel: string
  unit: string
  value: number
  quality: string
  timestamp: string
  sensorTag: string
}

export interface FleetNodeHeadline {
  sensorId: string
  channel: string
  unit: string
  value: number
}

export interface FleetNode {
  id: string
  name: string
  location: string | null
  transport: string
  status: NodeStatus
  lastSeen: string | null
  hasQualityAlert: boolean
  headline: FleetNodeHeadline | null
}

export interface FleetSummary {
  total: number
  online: number
  offline: number
  unknown: number
  qualityAlerts: number
}

export type FleetStatusFilter = 'all' | 'online' | 'offline' | 'alerts'
