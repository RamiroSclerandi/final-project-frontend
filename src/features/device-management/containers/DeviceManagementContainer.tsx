import { useDevices } from '../application/useDevices'
import { useUpdateDevice } from '../application/useUpdateDevice'
import { useUpdateSensor } from '../application/useUpdateSensor'
import { toSafeUpdateErrorMessage } from '../domain/updateError'
import { DeviceList } from '../components/DeviceList'

/** Wires the devices fetch and the rename/locate/label mutations (CA-3). */
export function DeviceManagementContainer() {
  const { data: devices, isLoading } = useDevices()
  const updateDeviceMutation = useUpdateDevice()
  const updateSensorMutation = useUpdateSensor()

  if (isLoading) {
    return <p className="text-slate-400">Loading devices…</p>
  }

  const attemptedDeviceId = updateDeviceMutation.variables?.deviceId ?? null
  const attemptedSensorId = updateSensorMutation.variables?.sensorId ?? null

  const savingDeviceId = updateDeviceMutation.isPending
    ? attemptedDeviceId
    : null
  const savingSensorId = updateSensorMutation.isPending
    ? attemptedSensorId
    : null

  const errorDeviceId = updateDeviceMutation.isError ? attemptedDeviceId : null
  const errorSensorId = updateSensorMutation.isError ? attemptedSensorId : null

  const errorMessage =
    updateDeviceMutation.isError || updateSensorMutation.isError
      ? toSafeUpdateErrorMessage(
          updateDeviceMutation.error ?? updateSensorMutation.error,
        )
      : null

  return (
    <DeviceList
      devices={devices ?? []}
      onSaveDevice={(deviceId, update) =>
        updateDeviceMutation.mutate({ deviceId, update })
      }
      onSaveSensor={(sensorId, update) =>
        updateSensorMutation.mutate({ sensorId, update })
      }
      savingDeviceId={savingDeviceId}
      savingSensorId={savingSensorId}
      errorDeviceId={errorDeviceId}
      errorSensorId={errorSensorId}
      errorMessage={errorMessage}
    />
  )
}
