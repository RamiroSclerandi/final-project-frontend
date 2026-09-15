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
 * telemetry-history feature, same convention. `devices.Update` and
 * `sensors` were extended/added for device-management -- `Update` mirrors
 * the migration's column-scoped GRANTs exactly (REQ-DM-1/2/3), so a payload
 * outside the granted set fails to typecheck before it ever reaches PostgREST.
 *
 * Every table also carries `Insert`/`Update`/`Relationships` and every view
 * carries `Relationships`, even where this app never calls those methods:
 * supabase-js's `Database` generic only resolves at all when every table
 * satisfies `GenericTable` (all four fields) and every view satisfies at
 * least `Row`+`Relationships` -- one incomplete entry silently collapses the
 * WHOLE `Schema` type param to `never`, which is what surfaced here once
 * `.update()` was first used from this typed client. `measurements`' own
 * `Insert`/`Update` are `Record<string, never>` on purpose: the client must
 * never write to it (no insert policy, §7.1; REQ-RT-4).
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
          mac_address: string
          location_ref: string | null
          transport: string
          provisioned: boolean
        }
        Insert: {
          mac_address: string
          name: string
        }
        Update: {
          name?: string
          location_ref?: string | null
          transport?: string
          provisioned?: boolean
        }
        Relationships: []
      }
      sensors: {
        Row: {
          id: string
          device_id: string
          label: string | null
          pin_connection: string | null
          source: string
          tag: string
        }
        Insert: {
          device_id: string
          source: string
        }
        Update: {
          label?: string | null
          pin_connection?: string | null
        }
        Relationships: []
      }
      measurements: {
        Row: {
          sensor_id: string
          value: number
          timestamp: string
          quality: string
          ts_source: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
