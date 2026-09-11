import { createClient } from '@supabase/supabase-js'

import type { Database } from '../../lib/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must both be set.',
  )
}

/**
 * The single Supabase client instance for the app. Every read/write goes
 * through this client; only `shared/api` and each feature's `infrastructure`
 * layer may import `@supabase/supabase-js` directly (enforced by ESLint).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
