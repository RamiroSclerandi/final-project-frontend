import { useState, type FormEvent } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { TextField } from '../../../shared/design-system/atoms/TextField'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { SensorSummary } from '../domain/device'
import type { SensorUpdate } from '../domain/sensorUpdate'

export interface SensorEditFormProps {
  sensor: SensorSummary
  onSave: (update: SensorUpdate) => void
  isSaving: boolean
  errorMessage: string | null
}

/** Inline sensor labeling form (REQ-DM-3, REQ-CFG-2). */
export function SensorEditForm({
  sensor,
  onSave,
  isSaving,
  errorMessage,
}: SensorEditFormProps) {
  const { t } = useTranslation()
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-xs text-text-muted">
        {sensor.source}
        {sensor.tag && ` (${sensor.tag})`}
      </p>
      <TextField
        id={`sensor-label-${sensor.id}`}
        label={t('config.sensor.label')}
        value={label}
        onChange={setLabel}
      />
      <TextField
        id={`sensor-pin-${sensor.id}`}
        label={t('config.sensor.pin')}
        value={pinConnection}
        onChange={setPinConnection}
      />
      {errorMessage && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={isSaving}>
        {t('config.save')}
      </Button>
    </form>
  )
}
