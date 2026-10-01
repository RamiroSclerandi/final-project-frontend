import {
  DEFAULT_SAMPLING_INTERVAL_MS,
  deriveNodeStatus,
  latestTimestamp,
} from '../../../shared/lib/nodeStatus'
import type {
  FleetDeviceInput,
  FleetNode,
  FleetReadingInput,
  FleetStatusInput,
} from './fleetNode'
import { hasQualityAlert } from './hasQualityAlert'
import { pickHeadlineSensor } from './pickHeadlineSensor'

export interface FleetFreshness {
  samplingIntervalsById: Record<string, number>
  nowMs: number
}

/**
 * Joins devices with their status and latest readings into fleet-row
 * view-models. Activity is the newest of `last_seen` and the device's
 * readings, since the worker throttles `last_seen` writes.
 */
export function buildFleetNodes(
  devices: FleetDeviceInput[],
  statusesById: Record<string, FleetStatusInput>,
  readingsByDevice: Record<string, FleetReadingInput[]>,
  { samplingIntervalsById, nowMs }: FleetFreshness,
): FleetNode[] {
  return devices.map((device) => {
    const status = statusesById[device.id]
    const readings = readingsByDevice[device.id] ?? []
    const headline = pickHeadlineSensor(readings)
    const lastActivity = latestTimestamp([
      status?.lastSeen ?? null,
      ...readings.map((reading) => reading.timestamp),
    ])

    return {
      id: device.id,
      name: device.name,
      location: device.locationRef,
      transport: device.transport,
      status: deriveNodeStatus(
        status && { online: status.online, lastActivity },
        samplingIntervalsById[device.id] ?? DEFAULT_SAMPLING_INTERVAL_MS,
        nowMs,
      ),
      lastSeen: status ? lastActivity : null,
      hasQualityAlert: hasQualityAlert(readings),
      headline: headline
        ? {
            sensorId: headline.sensorId,
            channel: headline.channel,
            unit: headline.unit,
            value: headline.value,
          }
        : null,
    }
  })
}
