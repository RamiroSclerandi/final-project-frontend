import { useState } from 'react'

import { SelectField } from '../../../shared/design-system/atoms/SelectField'
import { TextField } from '../../../shared/design-system/atoms/TextField'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import type { Device } from '../domain/device'
import { TRANSPORTS } from '../domain/device'
import type { Transport } from '../domain/device'
import type { DeviceUpdate } from '../domain/deviceUpdate'

export interface DeviceEditFormProps {
  device: Device
  onChange: (update: DeviceUpdate) => void
  errorMessage: string | null
}

interface DeviceFields {
  name: string
  locationRef: string
  transport: Transport
  provisioned: boolean
}

function toDeviceUpdate(fields: DeviceFields): DeviceUpdate {
  return {
    name: fields.name,
    location_ref: fields.locationRef === '' ? null : fields.locationRef,
    transport: fields.transport,
    provisioned: fields.provisioned,
  }
}

/**
 * Device rename/locate/reconfigure fields (REQ-DM-1/2, REQ-DM-4, REQ-CFG-2).
 * Rendered inside the drawer's single config form: every edit reports the
 * allowlisted update upward, and the footer Save decides whether to send it.
 */
export function DeviceEditForm({
  device,
  onChange,
  errorMessage,
}: DeviceEditFormProps) {
  const { t } = useTranslation()
  const [fields, setFields] = useState<DeviceFields>({
    name: device.name,
    locationRef: device.locationRef ?? '',
    transport: device.transport,
    provisioned: device.provisioned,
  })

  function changeFields(next: Partial<DeviceFields>) {
    const merged = { ...fields, ...next }
    setFields(merged)
    onChange(toDeviceUpdate(merged))
  }

  const transportOptions = TRANSPORTS.map((option) => ({
    value: option,
    label: option,
  }))

  return (
    <div className="flex flex-col gap-3">
      <TextField
        id={`device-name-${device.id}`}
        label={t('config.device.name')}
        value={fields.name}
        onChange={(name) => changeFields({ name })}
        required
      />
      <TextField
        id={`device-location-${device.id}`}
        label={t('config.device.location')}
        value={fields.locationRef}
        onChange={(locationRef) => changeFields({ locationRef })}
      />
      <SelectField
        id={`device-transport-${device.id}`}
        label={t('config.device.transport')}
        value={fields.transport}
        options={transportOptions}
        onChange={(value) => changeFields({ transport: value as Transport })}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm text-text md:min-h-9">
        <input
          type="checkbox"
          checked={fields.provisioned}
          onChange={(event) =>
            changeFields({ provisioned: event.target.checked })
          }
          className="h-5 w-5 accent-accent md:h-4 md:w-4"
        />
        {t('config.device.provisioned')}
      </label>
      {errorMessage && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
