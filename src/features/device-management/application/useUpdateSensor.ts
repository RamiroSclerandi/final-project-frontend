import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Device } from '../domain/device'
import { DEVICES_QUERY_KEY } from '../domain/queryKeys'
import { applySensorUpdate } from '../domain/sensorUpdate'
import type { SensorUpdate } from '../domain/sensorUpdate'
import { updateSensor } from '../infrastructure/deviceRepository'

/** Labels a sensor (REQ-DM-3), updating the cache on success. */
export function useUpdateSensor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sensorId,
      update,
    }: {
      sensorId: string
      update: SensorUpdate
    }) => updateSensor(sensorId, update),
    onSuccess: (_data, { sensorId, update }) => {
      queryClient.setQueryData<Device[]>(DEVICES_QUERY_KEY, (devices) =>
        devices ? applySensorUpdate(devices, sensorId, update) : devices,
      )
    },
  })
}
