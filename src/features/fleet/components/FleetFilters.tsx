import { TextField } from '../../../shared/design-system/atoms/TextField'
import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { FleetStatusFilter } from '../domain/fleetNode'

export interface FleetFilterValue {
  status: FleetStatusFilter
  search: string
}

export interface FleetFiltersProps {
  value: FleetFilterValue
  onChange: (value: FleetFilterValue) => void
}

const STATUS_FILTERS: FleetStatusFilter[] = [
  'all',
  'online',
  'offline',
  'alerts',
]

const STATUS_FILTER_LABEL_KEYS: Record<FleetStatusFilter, TranslationKey> = {
  all: 'fleet.filter.all',
  online: 'fleet.filter.online',
  offline: 'fleet.filter.offline',
  alerts: 'fleet.filter.withAlerts',
}

/**
 * Status chip group plus a search field over node name/location
 * (REQ-FLEET-4). Both controls are fully controlled; `FleetContainer` owns
 * the filter state and passes the derived `filterNodes` output to the table.
 */
export function FleetFilters({ value, onChange }: FleetFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div
        role="group"
        aria-label={t('fleet.column.status')}
        className="flex flex-wrap gap-2"
      >
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={value.status === status}
            onClick={() => onChange({ ...value, status })}
            className="min-h-11 rounded-full border border-border px-3 text-sm text-text aria-pressed:border-accent aria-pressed:bg-surface-raised aria-pressed:font-semibold"
          >
            {t(STATUS_FILTER_LABEL_KEYS[status])}
          </button>
        ))}
      </div>
      <TextField
        id="fleet-filter-search"
        label={t('fleet.filter.search')}
        value={value.search}
        onChange={(search) => onChange({ ...value, search })}
      />
    </div>
  )
}
