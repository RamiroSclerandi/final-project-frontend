import { useState, type FormEvent } from 'react'

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

/** Inline device rename/locate/reconfigure form (REQ-DM-1/2, REQ-DM-4). */
export function DeviceEditForm({
  device,
  onSave,
  isSaving,
  errorMessage,
}: DeviceEditFormProps) {
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <p className="w-full text-xs text-slate-500">{device.macAddress}</p>
      <div className="flex flex-col gap-1">
        <label htmlFor={`device-name-${device.id}`}>Name</label>
        <input
          id={`device-name-${device.id}`}
          value={name}
          required
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`device-location-${device.id}`}>Location</label>
        <input
          id={`device-location-${device.id}`}
          value={locationRef}
          onChange={(event) => setLocationRef(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`device-transport-${device.id}`}>Transport</label>
        <select
          id={`device-transport-${device.id}`}
          value={transport}
          onChange={(event) => setTransport(event.target.value as Transport)}
        >
          {TRANSPORTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={provisioned}
          onChange={(event) => setProvisioned(event.target.checked)}
        />
        Provisioned
      </label>
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
