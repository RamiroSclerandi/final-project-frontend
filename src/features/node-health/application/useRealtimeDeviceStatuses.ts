import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { applyDeviceStatusUpdate } from '../domain/applyDeviceStatusUpdate'
import type { DeviceStatus } from '../domain/deviceStatus'
import { DEVICE_STATUSES_QUERY_KEY } from '../domain/queryKeys'
import {
  subscribeToDeviceUpdates,
  unsubscribeFromDevices,
} from '../infrastructure/realtimeDevicesClient'

/**
 * Opens the devices-UPDATE channel once per mount (D-2 pattern) and applies
 * every status flip into the device-statuses cache (REQ-NH-1).
 */
export function useRealtimeDeviceStatuses(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToDeviceUpdates({
      onUpdate: (row) => {
        queryClient.setQueryData<Record<string, DeviceStatus>>(
          DEVICE_STATUSES_QUERY_KEY,
          (previous) => applyDeviceStatusUpdate(previous ?? {}, row),
        )
      },
    })

    return () => unsubscribeFromDevices(channel)
  }, [queryClient])
}
