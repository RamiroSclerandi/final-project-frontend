import { useMemo } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import { EmptyState } from '../../../shared/design-system/molecules/EmptyState'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useDevices } from '../../device-management'
import { useDeviceStatuses, useRealtimeDeviceStatuses } from '../../node-health'
import { useLatestReadings, useRealtimeReadings } from '../../telemetry'
import { buildFleetNodes } from '../domain/buildFleetNodes'
import { groupReadingsByDevice } from '../domain/groupReadingsByDevice'
import { summarizeFleet } from '../domain/summarizeFleet'
import { FleetHeader } from '../components/FleetHeader'
import { FleetTable, type FleetRow } from '../components/FleetTable'

/**
 * Wires the existing device/status/reading hooks (unchanged signatures,
 * decision #419) into the fleet view-model (REQ-FLEET-1/2/3). The sparkline
 * column is left `null` here -- PR-5 fills it via `useFleetSparklines`.
 */
export function FleetContainer() {
  const { t } = useTranslation()
  const devicesQuery = useDevices()
  const statusesQuery = useDeviceStatuses()
  useRealtimeDeviceStatuses()
  const readingsQuery = useLatestReadings()
  const { status: connectionStatus } = useRealtimeReadings()

  const readingsByDevice = useMemo(
    () => groupReadingsByDevice(Object.values(readingsQuery.data ?? {})),
    [readingsQuery.data],
  )
  const nodes = useMemo(
    () =>
      buildFleetNodes(
        devicesQuery.data ?? [],
        statusesQuery.data ?? {},
        readingsByDevice,
      ),
    [devicesQuery.data, statusesQuery.data, readingsByDevice],
  )
  const summary = useMemo(() => summarizeFleet(nodes), [nodes])
  const rows: FleetRow[] = useMemo(
    () => nodes.map((node) => ({ ...node, sparkline: null })),
    [nodes],
  )

  if (devicesQuery.isPending) {
    return <Skeleton lines={6} />
  }

  if (devicesQuery.isError) {
    return (
      <EmptyState
        title={t('fleet.error.title')}
        body={t('fleet.error.body')}
        action={
          <Button variant="secondary" onClick={() => devicesQuery.refetch()}>
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <FleetHeader summary={summary} connectionStatus={connectionStatus} />
      {rows.length === 0 ? (
        <EmptyState
          title={t('fleet.empty.title')}
          body={t('fleet.empty.body')}
        />
      ) : (
        <FleetTable rows={rows} />
      )}
    </div>
  )
}
