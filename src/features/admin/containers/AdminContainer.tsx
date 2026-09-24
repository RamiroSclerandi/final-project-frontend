import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import { EmptyState } from '../../../shared/design-system/molecules/EmptyState'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useDevices } from '../../device-management'
import { useDeviceStatuses } from '../../node-health'
import { filterUnassignedDevices } from '../domain/filterUnassignedDevices'
import { UnassignedDevicesTable } from '../components/UnassignedDevicesTable'

/**
 * Wires the existing `useDevices` hook (unchanged signature, decision #419)
 * through `filterUnassignedDevices` (REQ-ADMIN-1). Clients and Users have no
 * backing table yet (decision #411), so this container never queries them --
 * their tabs render their placeholder directly from `AdminPage`.
 *
 * `useDeviceStatuses` is joined in for `lastSeen` alone: recency is what
 * turns this list into a triage queue, and `node-health` already maps
 * `devices.last_seen`, so no change to `device-management` is needed. It is
 * deliberately not part of the loading or error gate -- the device list is
 * the point of the screen, so a failing status query degrades one column to
 * "not available" instead of hiding every ownerless device.
 */
export function AdminContainer() {
  const { t } = useTranslation()
  const devicesQuery = useDevices()
  const statusesQuery = useDeviceStatuses()

  if (devicesQuery.isPending) {
    return <Skeleton lines={4} />
  }

  if (devicesQuery.isError) {
    return (
      <EmptyState
        title={t('admin.unassigned.error.title')}
        body={t('admin.unassigned.error.body')}
        action={
          <Button variant="secondary" onClick={() => devicesQuery.refetch()}>
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  const unassigned = filterUnassignedDevices(devicesQuery.data ?? [])

  // Every device claimed is the good outcome, not a failure -- phrase the
  // empty state accordingly rather than as a generic "no data" message.
  if (unassigned.length === 0) {
    return (
      <EmptyState
        title={t('admin.unassigned.empty.title')}
        body={t('admin.unassigned.empty.body')}
      />
    )
  }

  const rows = unassigned.map((device) => ({
    ...device,
    lastSeen: statusesQuery.data?.[device.id]?.lastSeen ?? null,
  }))

  return <UnassignedDevicesTable devices={rows} />
}
