import { useQuery } from '@tanstack/react-query'

import { fetchLatestReadings } from '../infrastructure/latestReadingsClient'
import { LATEST_READINGS_QUERY_KEY } from '../domain/queryKeys'
import { toReadingsRecord } from '../domain/toReadingsRecord'

/** Initial fetch of `v_latest_readings` (D-2), seeding the per-sensor cache. */
export function useLatestReadings() {
  return useQuery({
    queryKey: LATEST_READINGS_QUERY_KEY,
    queryFn: async () => toReadingsRecord(await fetchLatestReadings()),
  })
}
