/**
 * Placeholder generated-types module.
 *
 * The real file is produced by `pnpm gen:types` (see D-4 in the design),
 * which needs `SUPABASE_PROJECT_ID` and `SUPABASE_ACCESS_TOKEN` — CI-only
 * secrets that are not available in this environment. This hand-written
 * placeholder is NOT a generated file; it exists only so `createClient`
 * has a `Database` type to compile against. Run `pnpm gen:types` against
 * the deployed project and commit the result before relying on real
 * column types.
 *
 * `v_latest_readings` was added by hand for the telemetry-live feature,
 * declaring only the columns that feature selects — replace with the real
 * generated file, which will carry every column, once `gen:types` can run.
 * `devices` was added by hand the same way, for the node-health feature.
 * `measurements` and both matviews were added by hand for the
 * telemetry-history feature, same convention.
 */
export type Database = {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          name: string
          status: boolean
          last_seen: string | null
        }
      }
      measurements: {
        Row: {
          sensor_id: string
          value: number
          timestamp: string
          quality: string
          ts_source: string
        }
      }
    }
    Views: {
      v_latest_readings: {
        Row: {
          sensor_id: string
          value: number
          timestamp: string
          quality: string
          channel: string
          unit: string
          sensor_label: string | null
          device_name: string
        }
      }
      mv_measurements_hourly: {
        Row: {
          sensor_id: string
          bucket: string
          avg_value: number
          min_value: number
          max_value: number
          sample_count: number
        }
      }
      mv_measurements_daily: {
        Row: {
          sensor_id: string
          bucket: string
          avg_value: number
          min_value: number
          max_value: number
          sample_count: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
