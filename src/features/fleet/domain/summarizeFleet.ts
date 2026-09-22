import type { FleetNode, FleetSummary } from './fleetNode'

const EMPTY_SUMMARY: FleetSummary = {
  total: 0,
  online: 0,
  offline: 0,
  unknown: 0,
  qualityAlerts: 0,
}

/** Aggregates fleet-wide KPI counts from the built nodes (REQ-FLEET-1). */
export function summarizeFleet(nodes: FleetNode[]): FleetSummary {
  return nodes.reduce(
    (summary, node) => ({
      total: summary.total + 1,
      online: summary.online + (node.status === 'online' ? 1 : 0),
      offline: summary.offline + (node.status === 'offline' ? 1 : 0),
      unknown: summary.unknown + (node.status === 'unknown' ? 1 : 0),
      qualityAlerts: summary.qualityAlerts + (node.hasQualityAlert ? 1 : 0),
    }),
    EMPTY_SUMMARY,
  )
}
