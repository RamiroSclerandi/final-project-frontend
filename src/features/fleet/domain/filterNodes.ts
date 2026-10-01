import type { FleetNode, FleetStatusFilter } from './fleetNode'

export interface FleetFilterCriteria {
  status: FleetStatusFilter
  search: string
}

function matchesStatus(node: FleetNode, status: FleetStatusFilter): boolean {
  if (status === 'all') {
    return true
  }
  if (status === 'alerts') {
    return node.hasQualityAlert
  }
  if (status === 'offline') {
    return node.status === 'offline' || node.status === 'stale'
  }
  return node.status === status
}

function matchesSearch(node: FleetNode, search: string): boolean {
  if (search === '') {
    return true
  }
  const needle = search.toLowerCase()
  return (
    node.name.toLowerCase().includes(needle) ||
    (node.location?.toLowerCase().includes(needle) ?? false)
  )
}

/**
 * Narrows fleet nodes by status filter and a case-insensitive search over
 * name/location (REQ-FLEET-4).
 */
export function filterNodes(
  nodes: FleetNode[],
  criteria: FleetFilterCriteria,
): FleetNode[] {
  return nodes.filter(
    (node) =>
      matchesStatus(node, criteria.status) &&
      matchesSearch(node, criteria.search),
  )
}
