import { useMemo } from 'react'

import type { FleetRow } from '../components/FleetTable'
import type { FleetFilterValue } from '../components/FleetFilters'
import { buildFleetNodes } from '../domain/buildFleetNodes'
import { filterNodes } from '../domain/filterNodes'
import type {
  FleetDeviceInput,
  FleetReadingInput,
  FleetStatusInput,
  FleetSummary,
} from '../domain/fleetNode'
import { groupReadingsByDevice } from '../domain/groupReadingsByDevice'
import { summarizeFleet } from '../domain/summarizeFleet'
import { useNow } from '../../../shared/time/useNow'
import { useFleetSparklines } from './useFleetSparklines'

interface FleetRowsInput {
  devices: FleetDeviceInput[]
  statuses: Record<string, FleetStatusInput>
  readings: FleetReadingInput[]
  samplingIntervalsById: Record<string, number> | null
  filter: FleetFilterValue
}

/**
 * Turns the raw query results into what the table renders. The summary counts
 * the whole fleet while the rows are filtered, so narrowing by status never
 * changes the headline numbers. Sparklines are fetched for the filtered rows
 * only, so a hidden node costs no request.
 */
export function useFleetRows({
  devices,
  statuses,
  readings,
  samplingIntervalsById,
  filter,
}: FleetRowsInput): { rows: FleetRow[]; summary: FleetSummary } {
  const readingsByDevice = useMemo(
    () => groupReadingsByDevice(readings),
    [readings],
  )
  const nowMs = useNow()
  const nodes = useMemo(
    () =>
      buildFleetNodes(devices, statuses, readingsByDevice, {
        samplingIntervalsById,
        nowMs,
      }),
    [devices, statuses, readingsByDevice, samplingIntervalsById, nowMs],
  )
  const summary = useMemo(() => summarizeFleet(nodes), [nodes])
  const filteredNodes = useMemo(
    () => filterNodes(nodes, filter),
    [nodes, filter],
  )
  const headlineSensorIds = useMemo(
    () =>
      filteredNodes.flatMap((node) =>
        node.headline ? [node.headline.sensorId] : [],
      ),
    [filteredNodes],
  )
  const sparklinesBySensorId = useFleetSparklines(headlineSensorIds)

  const rows = useMemo(
    () =>
      filteredNodes.map((node) => ({
        ...node,
        sparkline: node.headline
          ? (sparklinesBySensorId[node.headline.sensorId] ?? null)
          : null,
      })),
    [filteredNodes, sparklinesBySensorId],
  )

  return { rows, summary }
}
