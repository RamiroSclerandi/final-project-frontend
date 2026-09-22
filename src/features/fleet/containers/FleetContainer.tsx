import { useMemo, useState } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import { EmptyState } from '../../../shared/design-system/molecules/EmptyState'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useDevices } from '../../device-management'
import { useDeviceStatuses, useRealtimeDeviceStatuses } from '../../node-health'
import { useLatestReadings, useRealtimeReadings } from '../../telemetry'
import { useFleetRows } from '../application/useFleetRows'
import { FleetFilters, type FleetFilterValue } from '../components/FleetFilters'
import { FleetHeader } from '../components/FleetHeader'
import { FleetTable, type FleetRow } from '../components/FleetTable'

const DEFAULT_FILTER: FleetFilterValue = { status: 'all', search: '' }

/**
 * Wires the existing device/status/reading hooks (unchanged signatures,
 * decision #419) into the fleet view-model (REQ-FLEET-1/2/3), the status/
 * search filters (REQ-FLEET-4), and the desktop-only sparkline trend column
 * (REQ-FLEET-5, D4).
 */
export function FleetContainer() {
  const { t } = useTranslation()
  const devicesQuery = useDevices()
  const statusesQuery = useDeviceStatuses()
  useRealtimeDeviceStatuses()
  const readingsQuery = useLatestReadings()
  const { status: connectionStatus } = useRealtimeReadings()
  const [filter, setFilter] = useState<FleetFilterValue>(DEFAULT_FILTER)

  const readings = useMemo(
    () => Object.values(readingsQuery.data ?? {}),
    [readingsQuery.data],
  )
  const { rows, summary } = useFleetRows({
    devices: devicesQuery.data ?? [],
    statuses: statusesQuery.data ?? {},
    readings,
    filter,
  })

  if (devicesQuery.isPending) {
    return <Skeleton lines={6} />
  }

  const hasQueryError =
    devicesQuery.isError || statusesQuery.isError || readingsQuery.isError

  if (hasQueryError) {
    return (
      <EmptyState
        title={t('fleet.error.title')}
        body={t('fleet.error.body')}
        action={
          <Button
            variant="secondary"
            onClick={() => {
              devicesQuery.refetch()
              statusesQuery.refetch()
              readingsQuery.refetch()
            }}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <FleetHeader summary={summary} connectionStatus={connectionStatus} />
      <FleetListSection
        hasDevices={summary.total > 0}
        filter={filter}
        onFilterChange={setFilter}
        rows={rows}
      />
    </div>
  )
}

interface FleetListSectionProps {
  hasDevices: boolean
  filter: FleetFilterValue
  onFilterChange: (value: FleetFilterValue) => void
  rows: FleetRow[]
}

/** The devices/filters/rows region below the KPI header, isolated so `FleetContainer` stays focused on data wiring. */
function FleetListSection({
  hasDevices,
  filter,
  onFilterChange,
  rows,
}: FleetListSectionProps) {
  const { t } = useTranslation()

  if (!hasDevices) {
    return (
      <EmptyState title={t('fleet.empty.title')} body={t('fleet.empty.body')} />
    )
  }

  return (
    <>
      <FleetFilters value={filter} onChange={onFilterChange} />
      {rows.length === 0 ? (
        <EmptyState
          title={t('fleet.filteredEmpty.title')}
          body={t('fleet.filteredEmpty.body')}
        />
      ) : (
        <FleetTable rows={rows} />
      )}
    </>
  )
}
