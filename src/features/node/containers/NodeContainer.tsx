import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import { EmptyState } from '../../../shared/design-system/molecules/EmptyState'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import {
  pickStaleAfterMs,
  resolveNodeStatus,
} from '../../../shared/lib/nodeStatus'
import { useNow } from '../../../shared/time/useNow'
import { DeviceConfigContainer, useDevices } from '../../device-management'
import { useDeviceStatuses, useRealtimeDeviceStatuses } from '../../node-health'
import {
  SamplingIntervalContainer,
  useSamplingIntervals,
} from '../../remote-config'
import { useLatestReadings, useRealtimeReadings } from '../../telemetry'
import { NodeConfigDrawer } from '../components/NodeConfigDrawer'
import { NodeHeader } from '../components/NodeHeader'
import { SensorGroup } from '../components/SensorGroup'
import { groupSensorsByChannel } from '../domain/groupSensorsByChannel'
import { pickNodeRssi } from '../domain/pickNodeRssi'

export interface NodeContainerProps {
  deviceId: string
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
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  // Bumped on every open so the drawer's forms remount: closing by X or Escape discards drafts too.
  const [configSession, setConfigSession] = useState(0)
  const devicesQuery = useDevices()
  const statusesQuery = useDeviceStatuses()
  useRealtimeDeviceStatuses()
  const readingsQuery = useLatestReadings()
  useRealtimeReadings({ onUnknownSensor: () => void devicesQuery.refetch() })
  const samplingIntervalsById = useSamplingIntervals()
  const nowMs = useNow()

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

  const { status, lastActivity } = resolveNodeStatus(
    statusesQuery.data?.[deviceId],
    readings.map((reading) => reading.timestamp),
    pickStaleAfterMs(samplingIntervalsById, deviceId),
    nowMs,
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <NodeHeader
        name={device.name}
        location={device.locationRef}
        status={status}
        lastSeen={lastActivity}
        firmwareVersion={device.firmwareVersion}
        transport={device.transport}
        rssi={pickNodeRssi(readings)}
        onOpenConfig={() => {
          setConfigSession((session) => session + 1)
          setIsConfigOpen(true)
        }}
      />
      {groups.length === 0 ? (
        <EmptyState title={t('node.empty.title')} body={t('node.empty.body')} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {groups.map((group) => (
            <SensorGroup key={group.channel} group={group} nodeId={deviceId} />
          ))}
        </div>
      )}
      <NodeConfigDrawer
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title={t('node.config.title', { name: device.name })}
        subtitle={device.macAddress}
      >
        <Fragment key={configSession}>
          <SamplingIntervalContainer deviceId={deviceId} />
          <DeviceConfigContainer
            deviceId={deviceId}
            onCancel={() => setIsConfigOpen(false)}
          />
        </Fragment>
      </NodeConfigDrawer>
    </div>
  )
}
