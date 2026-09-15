import { useState, type FormEvent } from 'react'

import type { SensorSummary } from '../domain/device'
import type { SensorUpdate } from '../domain/sensorUpdate'

export interface SensorEditFormProps {
  sensor: SensorSummary
  onSave: (update: SensorUpdate) => void
  isSaving: boolean
  errorMessage: string | null
}

/** Inline sensor labeling form (REQ-DM-3). */
export function SensorEditForm({
  sensor,
  onSave,
  isSaving,
  errorMessage,
}: SensorEditFormProps) {
  const [label, setLabel] = useState(sensor.label ?? '')
  const [pinConnection, setPinConnection] = useState(sensor.pinConnection ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({
      label: label === '' ? null : label,
      pin_connection: pinConnection === '' ? null : pinConnection,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <p className="text-xs text-slate-500">
        {sensor.source}
        {sensor.tag && ` (${sensor.tag})`}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor={`sensor-label-${sensor.id}`}>Label</label>
        <input
          id={`sensor-label-${sensor.id}`}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`sensor-pin-${sensor.id}`}>Pin</label>
        <input
          id={`sensor-pin-${sensor.id}`}
          value={pinConnection}
          onChange={(event) => setPinConnection(event.target.value)}
        />
      </div>
      {errorMessage && (
        <p role="alert" className="w-full text-sm text-red-500">
          {errorMessage}
        </p>
      )}
      <button type="submit" disabled={isSaving}>
        Save
      </button>
    </form>
  )
}
