import { SelectField } from '../../../shared/design-system/atoms/SelectField'
import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { chooseGranularity } from '../domain/chooseGranularity'
import type {
  Granularity,
  GranularityChoice,
} from '../domain/chooseGranularity'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

type PresetId = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

const PRESET_ORDER: PresetId[] = [
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
]

const PRESET_MS: Record<PresetId, number> = {
  hour: HOUR_MS,
  day: DAY_MS,
  week: 7 * DAY_MS,
  month: 30 * DAY_MS,
  quarter: 90 * DAY_MS,
  year: 365 * DAY_MS,
}

const PRESET_LABEL_KEYS = {
  hour: 'sensor.range.preset.hour',
  day: 'sensor.range.preset.day',
  week: 'sensor.range.preset.week',
  month: 'sensor.range.preset.month',
  quarter: 'sensor.range.preset.quarter',
  year: 'sensor.range.preset.year',
} satisfies Record<PresetId, TranslationKey>

const GRANULARITY_OPTIONS: readonly GranularityChoice[] = [
  'auto',
  'raw',
  'hourly',
  'daily',
]

const GRANULARITY_LABEL_KEYS = {
  raw: 'sensor.granularity.raw',
  hourly: 'sensor.granularity.hourly',
  daily: 'sensor.granularity.daily',
} satisfies Record<Granularity, TranslationKey>

function isGranularityChoice(value: string): value is GranularityChoice {
  return (GRANULARITY_OPTIONS as readonly string[]).includes(value)
}

export interface RangePickerProps {
  from: Date
  to: Date
  onChange: (range: { from: Date; to: Date }) => void
  granularity: GranularityChoice
  onGranularityChange: (granularity: GranularityChoice) => void
}

/** `datetime-local` inputs read/write local time with no timezone suffix. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Preset, custom range, and granularity-override selection (REQ-SENSOR-2,
 * D-3, D2). `auto` shows the label its `chooseGranularity` result resolves
 * to; any other choice is threaded straight through to `useHistoricalSeries`.
 */
export function RangePicker({
  from,
  to,
  onChange,
  granularity,
  onGranularityChange,
}: RangePickerProps) {
  const { t } = useTranslation()
  const resolvedGranularity = chooseGranularity(to.getTime() - from.getTime())

  function selectPreset(ms: number) {
    const now = new Date()
    onChange({ from: new Date(now.getTime() - ms), to: now })
  }

  function granularityLabel(choice: GranularityChoice): string {
    if (choice === 'auto') {
      return t('sensor.granularity.auto', {
        resolved: t(GRANULARITY_LABEL_KEYS[resolvedGranularity]),
      })
    }
    return t(GRANULARITY_LABEL_KEYS[choice])
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm text-text-muted">
        {t('sensor.range.label')}
      </legend>
      <div className="flex flex-wrap gap-2">
        {PRESET_ORDER.map((preset) => (
          <button
            key={preset}
            type="button"
            className="min-h-11 rounded-md border border-border px-3 text-sm text-text hover:bg-surface-raised"
            onClick={() => selectPreset(PRESET_MS[preset])}
          >
            {t(PRESET_LABEL_KEYS[preset])}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="range-from" className="text-sm font-medium text-text">
            {t('sensor.range.from')}
          </label>
          <input
            id="range-from"
            type="datetime-local"
            value={toLocalInputValue(from)}
            onChange={(event) =>
              onChange({ from: new Date(event.target.value), to })
            }
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-base text-text focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="range-to" className="text-sm font-medium text-text">
            {t('sensor.range.to')}
          </label>
          <input
            id="range-to"
            type="datetime-local"
            value={toLocalInputValue(to)}
            onChange={(event) =>
              onChange({ from, to: new Date(event.target.value) })
            }
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-base text-text focus:border-accent"
          />
        </div>
      </div>
      <SelectField
        id="range-granularity"
        label={t('sensor.granularity.label')}
        value={granularity}
        options={GRANULARITY_OPTIONS.map((choice) => ({
          value: choice,
          label: granularityLabel(choice),
        }))}
        onChange={(value) => {
          if (isGranularityChoice(value)) {
            onGranularityChange(value)
          }
        }}
      />
    </fieldset>
  )
}
