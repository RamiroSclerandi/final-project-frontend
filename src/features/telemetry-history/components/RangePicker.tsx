import { SelectField } from '../../../shared/design-system/atoms/SelectField'
import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { chooseGranularity } from '../domain/chooseGranularity'
import type {
  Granularity,
  GranularityChoice,
} from '../domain/chooseGranularity'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

type PresetId =
  | 'minutes5'
  | 'minutes15'
  | 'minutes30'
  | 'hours1'
  | 'hours6'
  | 'hours24'
  | 'days15'
  | 'days30'
  | 'days90'
  | 'days180'
  | 'days365'

const PRESET_ORDER: PresetId[] = [
  'minutes5',
  'minutes15',
  'minutes30',
  'hours1',
  'hours6',
  'hours24',
  'days15',
  'days30',
  'days90',
  'days180',
  'days365',
]

const PRESET_MS: Record<PresetId, number> = {
  minutes5: 5 * MINUTE_MS,
  minutes15: 15 * MINUTE_MS,
  minutes30: 30 * MINUTE_MS,
  hours1: HOUR_MS,
  hours6: 6 * HOUR_MS,
  hours24: DAY_MS,
  days15: 15 * DAY_MS,
  days30: 30 * DAY_MS,
  days90: 90 * DAY_MS,
  days180: 180 * DAY_MS,
  days365: 365 * DAY_MS,
}

const PRESET_LABEL_KEYS = {
  minutes5: 'sensor.range.preset.minutes5',
  minutes15: 'sensor.range.preset.minutes15',
  minutes30: 'sensor.range.preset.minutes30',
  hours1: 'sensor.range.preset.hours1',
  hours6: 'sensor.range.preset.hours6',
  hours24: 'sensor.range.preset.hours24',
  days15: 'sensor.range.preset.days15',
  days30: 'sensor.range.preset.days30',
  days90: 'sensor.range.preset.days90',
  days180: 'sensor.range.preset.days180',
  days365: 'sensor.range.preset.days365',
} satisfies Record<PresetId, TranslationKey>

const GRANULARITY_OPTIONS: readonly GranularityChoice[] = [
  'auto',
  'raw',
  'minute',
  'hourly',
  'daily',
]

const GRANULARITY_LABEL_KEYS = {
  raw: 'sensor.granularity.raw',
  minute: 'sensor.granularity.minute',
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

  function changeCustomRange(next: { from: Date; to: Date }) {
    const fromMs = next.from.getTime()
    const toMs = next.to.getTime()
    if (Number.isNaN(fromMs) || Number.isNaN(toMs) || fromMs >= toMs) {
      return
    }
    onChange(next)
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
            max={toLocalInputValue(to)}
            onChange={(event) =>
              changeCustomRange({ from: new Date(event.target.value), to })
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
            min={toLocalInputValue(from)}
            onChange={(event) =>
              changeCustomRange({ from, to: new Date(event.target.value) })
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
