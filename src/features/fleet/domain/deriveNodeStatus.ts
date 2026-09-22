import type { FleetStatusInput, NodeStatus } from './fleetNode'

/**
 * No status row means the device has never reported in yet -- a D12-style
 * fallback (`unknown`), never a guessed `offline`.
 */
export function deriveNodeStatus(
  status: FleetStatusInput | undefined,
): NodeStatus {
  if (!status) {
    return 'unknown'
  }
  return status.online ? 'online' : 'offline'
}
