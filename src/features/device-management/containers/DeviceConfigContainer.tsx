import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useDevices } from '../application/useDevices'
import { useUpdateDevice } from '../application/useUpdateDevice'
import { useUpdateSensor } from '../application/useUpdateSensor'
import { DeviceEditForm } from '../components/DeviceEditForm'
import { SensorEditForm } from '../components/SensorEditForm'
import { toSafeUpdateErrorMessage } from '../domain/updateError'

export interface DeviceConfigContainerProps {
  deviceId: string
}

/**
 * One device's identification and sensor-labeling section inside
 * `NodeConfigDrawer` (CA-3, REQ-CFG-2, REQ-CFG-4, REQ-DM-5). Renders nothing
 * for a `deviceId` not present in the fetched devices -- the drawer only
 * mounts this once the node it belongs to is already confirmed to exist.
 */
export function DeviceConfigContainer({
  deviceId,
}: DeviceConfigContainerProps) {
  const { t } = useTranslation()
  const { data: devices, isLoading } = useDevices()
  const updateDeviceMutation = useUpdateDevice()
  const updateSensorMutation = useUpdateSensor()

  if (isLoading) {
    return <Skeleton lines={3} />
  }

  const device = devices?.find((candidate) => candidate.id === deviceId)

  if (!device) {
    return null
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

  function handleDismissError() {
    updateDeviceMutation.reset()
    updateSensorMutation.reset()
  }

  return (
    <div className="flex flex-col gap-4">
      <DeviceEditForm
        device={device}
        onSave={(update) =>
          updateDeviceMutation.mutate({ deviceId: device.id, update })
        }
        isSaving={savingDeviceId === device.id}
        errorMessage={errorDeviceId === device.id ? errorMessage : null}
      />
      {device.sensors.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          {device.sensors.map((sensor) => (
            <SensorEditForm
              key={sensor.id}
              sensor={sensor}
              onSave={(update) =>
                updateSensorMutation.mutate({ sensorId: sensor.id, update })
              }
              isSaving={savingSensorId === sensor.id}
              errorMessage={errorSensorId === sensor.id ? errorMessage : null}
            />
          ))}
        </div>
      )}
      {(errorDeviceId !== null || errorSensorId !== null) && (
        <Button variant="secondary" onClick={handleDismissError}>
          {t('common.dismiss')}
        </Button>
      )}
    </div>
  )
}
