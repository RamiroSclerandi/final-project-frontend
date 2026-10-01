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
  location: string
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
    location: t('fleet.column.location'),
    status: t('fleet.column.status'),
    headline: t('fleet.column.headline'),
    lastSeen: t('fleet.column.lastSeen'),
    trend: t('fleet.column.trend'),
    alerts: t('fleet.column.alerts'),
  }

  return (
    <table role="table" className="table-stack w-full min-w-0 tabular-nums">
      <thead>
        <tr role="row">
          <th role="columnheader" scope="col">
            {labels.node}
          </th>
          <th role="columnheader" scope="col">
            {labels.location}
          </th>
          <th role="columnheader" scope="col">
            {labels.status}
          </th>
          <th role="columnheader" scope="col">
            {labels.headline}
          </th>
          <th role="columnheader" scope="col">
            {labels.lastSeen}
          </th>
          <th
            role="columnheader"
            scope="col"
            className="hidden xl:table-cell"
            data-hidden-stacked
          >
            {labels.trend}
          </th>
          <th role="columnheader" scope="col">
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
  )
}

interface FleetTableRowProps {
  row: FleetRow
  labels: FleetColumnLabels
  notAvailable: string
}

function FleetTableRow({ row, labels, notAvailable }: FleetTableRowProps) {
  const { t } = useTranslation()

  return (
    <tr role="row">
      <td role="cell" data-label={labels.node}>
        <Link
          to={`/nodes/${row.id}`}
          className="inline-flex min-h-11 items-center text-accent"
        >
          {row.name}
        </Link>
      </td>
      <td role="cell" data-label={labels.location}>
        {row.location ?? notAvailable}
      </td>
      <td role="cell" data-label={labels.status}>
        <StatusChip status={row.status} />
      </td>
      <td role="cell" data-label={labels.headline}>
        {row.headline ? (
          <Value value={row.headline.value} unit={row.headline.unit} />
        ) : (
          notAvailable
        )}
      </td>
      <td role="cell" data-label={labels.lastSeen}>
        {row.lastActivity ? (
          <RelativeTime iso={row.lastActivity} />
        ) : (
          notAvailable
        )}
      </td>
      <td
        role="cell"
        data-label={labels.trend}
        className="hidden xl:table-cell"
        data-hidden-stacked
      >
        {row.sparkline ? (
          <Sparkline values={row.sparkline} label={labels.trend} />
        ) : null}
      </td>
      <td role="cell" data-label={labels.alerts}>
        {row.hasQualityAlert ? (
          <Chip>{t('fleet.kpi.qualityAlerts')}</Chip>
        ) : null}
      </td>
    </tr>
  )
}
