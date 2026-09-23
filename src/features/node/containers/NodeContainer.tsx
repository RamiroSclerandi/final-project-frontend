import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import type { NodeStatus } from '../../../shared/design-system/atoms/StatusDot'
import { EmptyState } from '../../../shared/design-system/molecules/EmptyState'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useDevices } from '../../device-management'
import { useDeviceStatuses, useRealtimeDeviceStatuses } from '../../node-health'
import { useLatestReadings, useRealtimeReadings } from '../../telemetry'
import { NodeHeader } from '../components/NodeHeader'
import { SensorGroup } from '../components/SensorGroup'
import { groupSensorsByChannel } from '../domain/groupSensorsByChannel'
import { pickNodeRssi } from '../domain/pickNodeRssi'

export interface NodeContainerProps {
  deviceId: string
}

interface StatusInput {
  online: boolean
  lastSeen: string | null
}

function deriveStatus(status: StatusInput | undefined): NodeStatus {
  if (!status) {
    return 'unknown'
  }
  return status.online ? 'online' : 'offline'
}

/**
 * Wires the same device/status/reading hooks as `FleetContainer` (unchanged
 * signatures, decision #419), filtered to one device, into the node header
 * and the per-channel sensor groups (REQ-NODE-1/2/3/4). A `deviceId` that
 * matches no device renders a not-found empty state with a link back to the
 * fleet, rather than a blank page.
 */
export function NodeContainer({ deviceId }: NodeContainerProps) {
  const { t } = useTranslation()
  const devicesQuery = useDevices()
  const statusesQuery = useDeviceStatuses()
  useRealtimeDeviceStatuses()
  const readingsQuery = useLatestReadings()
  useRealtimeReadings()

  const readings = useMemo(
    () =>
      Object.values(readingsQuery.data ?? {}).filter(
        (reading) => reading.deviceId === deviceId,
      ),
    [readingsQuery.data, deviceId],
  )
  const groups = useMemo(() => groupSensorsByChannel(readings), [readings])

  if (devicesQuery.isPending) {
    return <Skeleton lines={6} />
  }

  const hasQueryError =
    devicesQuery.isError || statusesQuery.isError || readingsQuery.isError

  if (hasQueryError) {
    return (
      <EmptyState
        title={t('node.error.title')}
        body={t('node.error.body')}
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

  const device = devicesQuery.data?.find(
    (candidate) => candidate.id === deviceId,
  )

  if (!device) {
    return (
      <EmptyState
        title={t('node.notFound.title')}
        body={t('node.notFound.body')}
        action={
          <Link to="/" className="text-accent">
            {t('node.notFound.backLink')}
          </Link>
        }
      />
    )
  }

  const statusInput = statusesQuery.data?.[deviceId]

  return (
    <div className="flex flex-col gap-4 p-4">
      <NodeHeader
        name={device.name}
        location={device.locationRef}
        status={deriveStatus(statusInput)}
        lastSeen={statusInput?.lastSeen ?? null}
        firmwareVersion={device.firmwareVersion}
        transport={device.transport}
        rssi={pickNodeRssi(readings)}
      />
      {groups.length === 0 ? (
        <EmptyState title={t('node.empty.title')} body={t('node.empty.body')} />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <SensorGroup key={group.channel} group={group} nodeId={deviceId} />
          ))}
        </div>
      )}
    </div>
  )
}
