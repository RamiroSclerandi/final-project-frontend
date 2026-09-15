import { useQuery } from '@tanstack/react-query'

import { DEVICES_QUERY_KEY } from '../domain/queryKeys'
import { fetchDevices } from '../infrastructure/deviceRepository'

/** Every device with its sensors, for inline management (CA-3). */
export function useDevices() {
  return useQuery({ queryKey: DEVICES_QUERY_KEY, queryFn: fetchDevices })
}
