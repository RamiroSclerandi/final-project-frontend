import { useState } from 'react'

import { TextField } from '../../../shared/design-system/atoms/TextField'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { SensorSummary } from '../domain/device'
import type { SensorUpdate } from '../domain/sensorUpdate'

export interface SensorEditFormProps {
  sensor: SensorSummary
  onChange: (update: SensorUpdate) => void
  errorMessage: string | null
}

interface SensorFields {
  label: string
  pinConnection: string
}

function toSensorUpdate(fields: SensorFields): SensorUpdate {
  return {
    label: fields.label === '' ? null : fields.label,
    pin_connection: fields.pinConnection === '' ? null : fields.pinConnection,
  }
}

/**
 * One sensor's labeling fields (REQ-DM-3, REQ-CFG-2), rendered as a compact
 * row inside the drawer's single config form; edits report upward.
 */
export function SensorEditForm({
  sensor,
  onChange,
  errorMessage,
}: SensorEditFormProps) {
  const { t } = useTranslation()
  const [fields, setFields] = useState<SensorFields>({
    label: sensor.label ?? '',
    pinConnection: sensor.pinConnection ?? '',
  })

  function changeFields(next: Partial<SensorFields>) {
    const merged = { ...fields, ...next }
    setFields(merged)
    onChange(toSensorUpdate(merged))
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <p className="font-mono text-xs tabular-nums text-text-muted">
        {sensor.source}
        {sensor.tag && ` (${sensor.tag})`}
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          id={`sensor-label-${sensor.id}`}
          label={t('config.sensor.label')}
          value={fields.label}
          onChange={(label) => changeFields({ label })}
        />
        <TextField
          id={`sensor-pin-${sensor.id}`}
          label={t('config.sensor.pin')}
          value={fields.pinConnection}
          onChange={(pinConnection) => changeFields({ pinConnection })}
        />
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
