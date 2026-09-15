import { useQuery } from '@tanstack/react-query'

import { DEVICE_CONFIGS_QUERY_KEY } from '../domain/queryKeys'
import { fetchDeviceConfigSummaries } from '../infrastructure/remoteConfigRepository'

/** Every device paired with its current requested sampling interval, if any. */
export function useDeviceConfigs() {
  return useQuery({
    queryKey: DEVICE_CONFIGS_QUERY_KEY,
    queryFn: fetchDeviceConfigSummaries,
  })
}
