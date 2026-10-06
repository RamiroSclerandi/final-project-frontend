import { Chip } from '../../../shared/design-system/atoms/Chip'
import { RelativeTime } from '../../../shared/design-system/atoms/RelativeTime'
import { useTranslation } from '../../../shared/i18n/useTranslation'

/**
 * Local structural subset (cross-feature-boundary convention: duplicate a
 * narrow shape rather than import `device-management`'s `Device` domain
 * type into a `components/` file). `device-management`'s `Device` satisfies
 * this structurally; `lastSeen` is joined in by the container from
 * `node-health`, so it is null both for a device that never reported and
 * whenever that query is unavailable.
 */
export interface UnassignedDeviceRow {
  id: string
  name: string
  macAddress: string
  transport: string
  provisioned: boolean
  lastSeen: string | null
}

export interface UnassignedDevicesTableProps {
  devices: UnassignedDeviceRow[]
}

interface UnassignedColumnLabels {
  device: string
  mac: string
  transport: string
  provisioned: string
  lastSeen: string
}

/** Cell copy hoisted out of the row, so one row renders zero translations. */
interface UnassignedRowCopy {
  notAvailable: string
  yes: string
  no: string
}

/**
 * Ownerless devices as a real semantic `<table>` (D7), mirroring
 * `FleetTable`'s markup exactly (REQ-MOBILE-3): explicit roles keep AT
 * semantics once `.table-stack` swaps `display` below 768px, and every data
 * cell carries `data-label` so header association survives the swap.
 */
export function UnassignedDevicesTable({
  devices,
}: UnassignedDevicesTableProps) {
  const { t } = useTranslation()
  const labels: UnassignedColumnLabels = {
    device: t('admin.unassigned.column.device'),
    mac: t('admin.unassigned.column.mac'),
    transport: t('admin.unassigned.column.transport'),
    provisioned: t('admin.unassigned.column.provisioned'),
    lastSeen: t('admin.unassigned.column.lastSeen'),
  }
  const copy: UnassignedRowCopy = {
    notAvailable: t('common.notAvailable'),
    yes: t('admin.unassigned.provisioned.yes'),
    no: t('admin.unassigned.provisioned.no'),
  }

  return (
    <div className="md:overflow-hidden md:rounded-md md:border md:border-border md:bg-surface">
      <table
        role="table"
        className="table-stack table-stack--cards w-full min-w-0 text-base md:text-sm"
      >
        <thead>
          <tr role="row" className="bg-sunken">
            <th role="columnheader" scope="col" className={TH_CLASS}>
              {labels.device}
            </th>
            <th role="columnheader" scope="col" className={TH_CLASS}>
              {labels.mac}
            </th>
            <th role="columnheader" scope="col" className={TH_CLASS}>
              {labels.transport}
            </th>
            <th role="columnheader" scope="col" className={TH_CLASS}>
              {labels.provisioned}
            </th>
            <th role="columnheader" scope="col" className={TH_CLASS}>
              {labels.lastSeen}
            </th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <UnassignedDeviceRowItem
              key={device.id}
              device={device}
              labels={labels}
              copy={copy}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TH_CLASS =
  'px-3 py-2 text-left text-2xs font-medium uppercase tracking-label text-text-muted'
const TD_CLASS = 'md:px-3 md:py-1.5 md:align-middle'
const TD_MONO_CLASS = `${TD_CLASS} font-mono tabular-nums`

interface UnassignedDeviceRowItemProps {
  device: UnassignedDeviceRow
  labels: UnassignedColumnLabels
  copy: UnassignedRowCopy
}

function UnassignedDeviceRowItem({
  device,
  labels,
  copy,
}: UnassignedDeviceRowItemProps) {
  return (
    <tr
      role="row"
      className="bg-surface hover:bg-surface-raised md:h-10 md:border-b md:border-border md:bg-transparent md:last:border-b-0 md:hover:bg-surface-raised"
    >
      <td
        role="cell"
        data-label={labels.device}
        data-card-title
        className={`${TD_CLASS} font-medium text-text`}
      >
        {device.name}
      </td>
      <td role="cell" data-label={labels.mac} className={TD_MONO_CLASS}>
        {device.macAddress}
      </td>
      <td role="cell" data-label={labels.transport} className={TD_CLASS}>
        <Chip>{device.transport}</Chip>
      </td>
      <td role="cell" data-label={labels.provisioned} className={TD_CLASS}>
        {device.provisioned ? copy.yes : copy.no}
      </td>
      <td
        role="cell"
        data-label={labels.lastSeen}
        className={`${TD_MONO_CLASS} text-text-muted md:text-xs`}
      >
        {device.lastSeen ? (
          <RelativeTime iso={device.lastSeen} />
        ) : (
          copy.notAvailable
        )}
      </td>
    </tr>
  )
}
