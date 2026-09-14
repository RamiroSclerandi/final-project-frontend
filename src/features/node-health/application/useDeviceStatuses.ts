import { useQuery } from '@tanstack/react-query'

import type { DeviceStatus } from '../domain/deviceStatus'
import { DEVICE_STATUSES_QUERY_KEY } from '../domain/queryKeys'
import { fetchDeviceStatuses } from '../infrastructure/devicesClient'

/** Initial fetch of every device's status (CA-6), seeding the cache. */
export function useDeviceStatuses() {
  return useQuery({
    queryKey: DEVICE_STATUSES_QUERY_KEY,
    queryFn: async () => {
      const statuses = await fetchDeviceStatuses()
      const record: Record<string, DeviceStatus> = {}
      for (const status of statuses) {
        record[status.deviceId] = status
      }
      return record
    },
  })
}
