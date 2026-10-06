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
 * Search field plus a segmented status control over node name/location
 * (REQ-FLEET-4). Both controls are fully controlled; `FleetContainer` owns
 * the filter state and passes the derived `filterNodes` output to the table.
 */
export function FleetFilters({ value, onChange }: FleetFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative md:w-72">
        <SearchIcon />
        <input
          id="fleet-filter-search"
          type="text"
          aria-label={t('fleet.filter.search')}
          placeholder={t('fleet.filter.search')}
          value={value.search}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value })
          }
          className="min-h-11 w-full rounded-md border border-border-strong bg-sunken pr-3 pl-9 text-base text-text placeholder:text-text-faint focus:border-accent md:min-h-9 md:text-sm"
        />
      </div>
      <div>
        <div
          role="group"
          aria-label={t('fleet.column.status')}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border-strong bg-border-strong md:inline-flex md:gap-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent"
        >
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={value.status === status}
              onClick={() => onChange({ ...value, status })}
              className="min-h-11 border-0 border-border-strong md:-ml-px md:border bg-surface px-3 font-mono text-xs tracking-label whitespace-nowrap text-text-muted uppercase md:first:ml-0 md:first:rounded-l-md md:last:rounded-r-md hover:bg-surface-raised aria-pressed:z-10 aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent md:min-h-9"
            >
              {t(STATUS_FILTER_LABEL_KEYS[status])}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Decorative magnifier anchored inside the search field. */
function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-faint"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </svg>
  )
}
