import { chooseGranularity } from '../domain/chooseGranularity'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

const PRESETS = [
  { label: '1 hour', ms: HOUR_MS },
  { label: '24 hours', ms: DAY_MS },
  { label: '7 days', ms: 7 * DAY_MS },
  { label: '30 days', ms: 30 * DAY_MS },
  { label: '90 days', ms: 90 * DAY_MS },
  { label: '1 year', ms: 365 * DAY_MS },
]

export interface RangePickerProps {
  from: Date
  to: Date
  onChange: (range: { from: Date; to: Date }) => void
}

/** `datetime-local` inputs read/write local time with no timezone suffix. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Preset and custom range selection, presentational (REQ-HS-1, D-3). */
export function RangePicker({ from, to, onChange }: RangePickerProps) {
  const granularity = chooseGranularity(to.getTime() - from.getTime())

  function selectPreset(ms: number) {
    const now = new Date()
    onChange({ from: new Date(now.getTime() - ms), to: now })
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm text-slate-400">Range</legend>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => selectPreset(preset.ms)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="range-from">From</label>
          <input
            id="range-from"
            type="datetime-local"
            value={toLocalInputValue(from)}
            onChange={(event) =>
              onChange({ from: new Date(event.target.value), to })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="range-to">To</label>
          <input
            id="range-to"
            type="datetime-local"
            value={toLocalInputValue(to)}
            onChange={(event) =>
              onChange({ from, to: new Date(event.target.value) })
            }
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">Granularity: {granularity}</p>
    </fieldset>
  )
}
