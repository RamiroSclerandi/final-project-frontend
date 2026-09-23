import { useState, type FormEvent } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { SelectField } from '../../../shared/design-system/atoms/SelectField'
import { TextField } from '../../../shared/design-system/atoms/TextField'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { Device } from '../domain/device'
import { TRANSPORTS } from '../domain/device'
import type { Transport } from '../domain/device'
import type { DeviceUpdate } from '../domain/deviceUpdate'

export interface DeviceEditFormProps {
  device: Device
  onSave: (update: DeviceUpdate) => void
  isSaving: boolean
  errorMessage: string | null
}

/** Inline device rename/locate/reconfigure form (REQ-DM-1/2, REQ-DM-4, REQ-CFG-2). */
export function DeviceEditForm({
  device,
  onSave,
  isSaving,
  errorMessage,
}: DeviceEditFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(device.name)
  const [locationRef, setLocationRef] = useState(device.locationRef ?? '')
  const [transport, setTransport] = useState<Transport>(device.transport)
  const [provisioned, setProvisioned] = useState(device.provisioned)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({
      name,
      location_ref: locationRef === '' ? null : locationRef,
      transport,
      provisioned,
    })
  }

  const transportOptions = TRANSPORTS.map((option) => ({
    value: option,
    label: option,
  }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-xs text-text-muted">{device.macAddress}</p>
      <TextField
        id={`device-name-${device.id}`}
        label={t('config.device.name')}
        value={name}
        onChange={setName}
        required
      />
      <TextField
        id={`device-location-${device.id}`}
        label={t('config.device.location')}
        value={locationRef}
        onChange={setLocationRef}
      />
      <SelectField
        id={`device-transport-${device.id}`}
        label={t('config.device.transport')}
        value={transport}
        options={transportOptions}
        onChange={(value) => setTransport(value as Transport)}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={provisioned}
          onChange={(event) => setProvisioned(event.target.checked)}
          className="h-5 w-5"
        />
        {t('config.device.provisioned')}
      </label>
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
