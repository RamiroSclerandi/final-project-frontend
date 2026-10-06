export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      device_configs: {
        Row: {
          applied_at: string | null
          device_id: string
          requested_at: string
          sampling_interval_ms: number
          transmit_interval_ms: number | null
        }
        Insert: {
          applied_at?: string | null
          device_id: string
          requested_at?: string
          sampling_interval_ms?: number
          transmit_interval_ms?: number | null
        }
        Update: {
          applied_at?: string | null
          device_id?: string
          requested_at?: string
          sampling_interval_ms?: number
          transmit_interval_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "device_configs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_configs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "v_latest_readings"
            referencedColumns: ["device_id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          firmware_version: string | null
          id: string
          last_seen: string | null
          location_ref: string | null
          mac_address: string
          name: string
          owner_id: string | null
          provisioned: boolean
          status: boolean
          transport: string
        }
        Insert: {
          created_at?: string
          firmware_version?: string | null
          id?: string
          last_seen?: string | null
          location_ref?: string | null
          mac_address: string
          name: string
          owner_id?: string | null
          provisioned?: boolean
          status?: boolean
          transport?: string
        }
        Update: {
          created_at?: string
          firmware_version?: string | null
          id?: string
          last_seen?: string | null
          location_ref?: string | null
          mac_address?: string
          name?: string
          owner_id?: string | null
          provisioned?: boolean
          status?: boolean
          transport?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          battery_level: number | null
          boot: number | null
          id: number
          lost: number | null
          metadata: Json | null
          quality: string
          rssi: number | null
          sample_count: number | null
          sensor_id: string
          seq: number | null
          store_drop: number | null
          timestamp: string
          ts_source: string
          value: number
          value_max: number | null
          value_min: number | null
        }
        Insert: {
          battery_level?: number | null
          boot?: number | null
          id?: never
          lost?: number | null
          metadata?: Json | null
          quality?: string
          rssi?: number | null
          sample_count?: number | null
          sensor_id: string
          seq?: number | null
          store_drop?: number | null
          timestamp: string
          ts_source?: string
          value: number
          value_max?: number | null
          value_min?: number | null
        }
        Update: {
          battery_level?: number | null
          boot?: number | null
          id?: never
          lost?: number | null
          metadata?: Json | null
          quality?: string
          rssi?: number | null
          sample_count?: number | null
          sensor_id?: string
          seq?: number | null
          store_drop?: number | null
          timestamp?: string
          ts_source?: string
          value?: number
          value_max?: number | null
          value_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_messages: {
        Row: {
          device_hint: string | null
          error: string | null
          id: number
          payload: Json
          payload_md5: string | null
          processed: boolean
          received_at: string
          source: string
          topic: string
        }
        Insert: {
          device_hint?: string | null
          error?: string | null
          id?: never
          payload: Json
          payload_md5?: string | null
          processed?: boolean
          received_at?: string
          source: string
          topic: string
        }
        Update: {
          device_hint?: string | null
          error?: string | null
          id?: never
          payload?: Json
          payload_md5?: string | null
          processed?: boolean
          received_at?: string
          source?: string
          topic?: string
        }
        Relationships: []
      }
      sensor_types: {
        Row: {
          created_at: string
          expected_max: number | null
          expected_min: number | null
          id: string
          name: string
          unit: string
        }
        Insert: {
          created_at?: string
          expected_max?: number | null
          expected_min?: number | null
          id?: string
          name: string
          unit: string
        }
        Update: {
          created_at?: string
          expected_max?: number | null
          expected_min?: number | null
          id?: string
          name?: string
          unit?: string
        }
        Relationships: []
      }
      sensors: {
        Row: {
          created_at: string
          device_id: string
          id: string
          label: string | null
          pin_connection: string | null
          source: string
          tag: string
          type_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          label?: string | null
          pin_connection?: string | null
          source: string
          tag?: string
          type_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          label?: string | null
          pin_connection?: string | null
          source?: string
          tag?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensors_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensors_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "v_latest_readings"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "sensors_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "sensor_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_measurements_daily: {
        Row: {
          avg_value: number | null
          bucket: string | null
          max_value: number | null
          min_value: number | null
          sample_count: number | null
          sensor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_measurements_hourly: {
        Row: {
          avg_value: number | null
          bucket: string | null
          max_value: number | null
          min_value: number | null
          sample_count: number | null
          sensor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      v_latest_readings: {
        Row: {
          battery_level: number | null
          channel: string | null
          device_id: string | null
          device_name: string | null
          device_online: boolean | null
          location_ref: string | null
          mac_address: string | null
          quality: string | null
          rssi: number | null
          sensor_id: string | null
          sensor_label: string | null
          sensor_source: string | null
          sensor_tag: string | null
          timestamp: string | null
          transport: string | null
          unit: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_sensor_series: {
        Args: {
          p_bucket: string
          p_from: string
          p_sensor_id: string
          p_to: string
        }
        Returns: {
          avg_value: number
          bucket: string
          max_value: number
          min_value: number
          sample_count: number
        }[]
      }
      purge_raw_messages: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
