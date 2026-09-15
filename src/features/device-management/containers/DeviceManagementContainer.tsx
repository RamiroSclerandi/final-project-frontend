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
      savingDeviceId={
        updateDeviceMutation.isPending
          ? (updateDeviceMutation.variables?.deviceId ?? null)
          : null
      }
      savingSensorId={
        updateSensorMutation.isPending
          ? (updateSensorMutation.variables?.sensorId ?? null)
          : null
      }
      errorMessage={errorMessage}
    />
  )
}
