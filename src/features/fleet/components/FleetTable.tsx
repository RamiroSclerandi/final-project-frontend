import { Link } from 'react-router-dom'

import { Chip } from '../../../shared/design-system/atoms/Chip'
import { RelativeTime } from '../../../shared/design-system/atoms/RelativeTime'
import { Value } from '../../../shared/design-system/atoms/Value'
import { StatusChip } from '../../../shared/design-system/molecules/StatusChip'
import { Sparkline } from '../../../shared/design-system/molecules/Sparkline'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { FleetNode } from '../domain/fleetNode'

/** A fleet row plus its trend column -- `null` until PR-5 wires `useFleetSparklines`. */
export interface FleetRow extends FleetNode {
  sparkline: number[] | null
}

export interface FleetTableProps {
  rows: FleetRow[]
}

interface FleetColumnLabels {
  node: string
  status: string
  headline: string
  lastSeen: string
  trend: string
  alerts: string
}

/**
 * Fleet nodes as a real semantic `<table>` (D7): explicit roles keep AT
 * semantics once `.table-stack` swaps `display` below 768px, and every data
 * cell carries `data-label` so header association survives the swap
 * (REQ-FLEET-3, REQ-MOBILE-3). Root wrapper stays fluid (REQ-FLEET-6).
 */
export function FleetTable({ rows }: FleetTableProps) {
  const { t } = useTranslation()
  const labels: FleetColumnLabels = {
    node: t('fleet.column.node'),
    status: t('fleet.column.status'),
    headline: t('fleet.column.headline'),
    lastSeen: t('fleet.column.lastSeen'),
    trend: t('fleet.column.trend'),
    alerts: t('fleet.column.alerts'),
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
              {labels.status}
            </th>
            <th role="columnheader" scope="col" className={TH_CLASS}>
              {labels.node}
            </th>
            <th
              role="columnheader"
              scope="col"
              className={`${TH_CLASS} md:text-right`}
            >
              {labels.headline}
            </th>
            <th
              role="columnheader"
              scope="col"
              className={`${TH_CLASS} md:text-right`}
            >
              {labels.lastSeen}
            </th>
            <th
              role="columnheader"
              scope="col"
              className={`${TH_CLASS} hidden lg:table-cell lg:w-48`}
              data-hidden-stacked
            >
              {labels.trend}
            </th>
            <th role="columnheader" scope="col" className={TH_CLASS}>
              {labels.alerts}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <FleetTableRow
              key={row.id}
              row={row}
              labels={labels}
              notAvailable={t('common.notAvailable')}
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

interface FleetTableRowProps {
  row: FleetRow
  labels: FleetColumnLabels
  notAvailable: string
}

function FleetTableRow({ row, labels, notAvailable }: FleetTableRowProps) {
  const { t } = useTranslation()

  return (
    <tr
      role="row"
      className="bg-surface hover:bg-surface-raised md:h-10 md:border-b md:border-border md:bg-transparent md:last:border-b-0 md:hover:bg-surface-raised"
    >
      <td
        role="cell"
        data-label={labels.status}
        data-card-status
        className={TD_CLASS}
      >
        <StatusChip status={row.status} />
      </td>
      <td
        role="cell"
        data-label={labels.node}
        data-card-title
        className={TD_CLASS}
      >
        <Link
          to={`/nodes/${row.id}`}
          className="inline-flex min-h-11 items-center font-medium text-accent hover:underline md:min-h-0"
        >
          {row.name}
        </Link>
        <p className="text-sm text-text-muted md:text-xs">
          {row.location ?? notAvailable}
        </p>
      </td>
      <td
        role="cell"
        data-label={labels.headline}
        className={`${TD_CLASS} font-mono tabular-nums md:text-right`}
      >
        {row.headline ? (
          <Value value={row.headline.value} unit={row.headline.unit} />
        ) : (
          notAvailable
        )}
      </td>
      <td
        role="cell"
        data-label={labels.lastSeen}
        className={`${TD_CLASS} font-mono tabular-nums text-text-muted md:text-xs md:text-right`}
      >
        {row.lastActivity ? (
          <RelativeTime iso={row.lastActivity} />
        ) : (
          notAvailable
        )}
      </td>
      <td
        role="cell"
        data-label={labels.trend}
        className={`${TD_CLASS} hidden lg:table-cell`}
        data-hidden-stacked
      >
        {row.sparkline ? (
          <Sparkline values={row.sparkline} label={labels.trend} />
        ) : null}
      </td>
      <td role="cell" data-label={labels.alerts} className={TD_CLASS}>
        {row.hasQualityAlert ? (
          <Chip>{t('fleet.kpi.qualityAlerts')}</Chip>
        ) : null}
      </td>
    </tr>
  )
}
