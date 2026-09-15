import type { Device } from '../domain/device'
import type { DeviceUpdate } from '../domain/deviceUpdate'
import type { SensorUpdate } from '../domain/sensorUpdate'
import { DeviceEditForm } from './DeviceEditForm'
import { SensorEditForm } from './SensorEditForm'

export interface DeviceListProps {
  devices: Device[]
  onSaveDevice: (deviceId: string, update: DeviceUpdate) => void
  onSaveSensor: (sensorId: string, update: SensorUpdate) => void
  savingDeviceId: string | null
  savingSensorId: string | null
  errorMessage: string | null
}

/** One edit form per device, plus one per its sensors (CA-3). */
export function DeviceList({
  devices,
  onSaveDevice,
  onSaveSensor,
  savingDeviceId,
  savingSensorId,
  errorMessage,
}: DeviceListProps) {
  if (devices.length === 0) {
    return <p className="text-slate-400">No devices yet.</p>
  }

  return (
    <ul className="flex flex-col gap-4">
      {devices.map((device) => (
        <li
          key={device.id}
          className="rounded border border-slate-800 bg-slate-900 p-4"
        >
          <DeviceEditForm
            device={device}
            onSave={(update) => onSaveDevice(device.id, update)}
            isSaving={savingDeviceId === device.id}
            errorMessage={savingDeviceId === device.id ? errorMessage : null}
          />
          <ul className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3">
            {device.sensors.map((sensor) => (
              <li key={sensor.id}>
                <SensorEditForm
                  sensor={sensor}
                  onSave={(update) => onSaveSensor(sensor.id, update)}
                  isSaving={savingSensorId === sensor.id}
                  errorMessage={
                    savingSensorId === sensor.id ? errorMessage : null
                  }
                />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
