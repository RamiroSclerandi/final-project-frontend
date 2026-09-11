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
 */
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
