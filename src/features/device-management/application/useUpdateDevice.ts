import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Device } from '../domain/device'
import { applyDeviceUpdate } from '../domain/deviceUpdate'
import type { DeviceUpdate } from '../domain/deviceUpdate'
import { DEVICES_QUERY_KEY } from '../domain/queryKeys'
import { updateDevice } from '../infrastructure/deviceRepository'

/** Renames/locates/reconfigures a device (REQ-DM-1/2), updating the cache on success. */
export function useUpdateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      deviceId,
      update,
    }: {
      deviceId: string
      update: DeviceUpdate
    }) => updateDevice(deviceId, update),
    onSuccess: (_data, { deviceId, update }) => {
      queryClient.setQueryData<Device[]>(DEVICES_QUERY_KEY, (devices) =>
        devices ? applyDeviceUpdate(devices, deviceId, update) : devices,
      )
    },
  })
}
