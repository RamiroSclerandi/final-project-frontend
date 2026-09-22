import { deriveNodeStatus } from './deriveNodeStatus'
import type {
  FleetDeviceInput,
  FleetNode,
  FleetReadingInput,
  FleetStatusInput,
} from './fleetNode'
import { hasQualityAlert } from './hasQualityAlert'
import { pickHeadlineSensor } from './pickHeadlineSensor'

/** Joins devices with their status and latest readings into fleet-row view-models. */
export function buildFleetNodes(
  devices: FleetDeviceInput[],
  statusesById: Record<string, FleetStatusInput>,
  readingsByDevice: Record<string, FleetReadingInput[]>,
): FleetNode[] {
  return devices.map((device) => {
    const status = statusesById[device.id]
    const readings = readingsByDevice[device.id] ?? []
    const headline = pickHeadlineSensor(readings)

    return {
      id: device.id,
      name: device.name,
      location: device.locationRef,
      transport: device.transport,
      status: deriveNodeStatus(status),
      lastSeen: status?.lastSeen ?? null,
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
