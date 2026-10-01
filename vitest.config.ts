import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// Unit tier (D-6): jsdom for components, plain Node for scripts/** tests.
// Real-database integration tests live under tests/integration and run
// through vitest.config.integration.ts instead.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // One jsdom per worker instead of per file: ~3x faster, isolation kept.
    pool: 'vmThreads',
    // A file's first Recharts render can exceed 5 s when all workers compete for CPU.
    testTimeout: 10_000,
    setupFiles: ['./vitest.setup.ts'],
    // `shared/api/supabase` throws at import time when these are missing, which
    // is what we want of the real app and wrong for a unit test: importing a
    // module that merely sits downstream of the client should not need
    // credentials. These placeholders are never dialled -- the unit tier mocks
    // every repository -- and CI has no `.env`, so without them any test whose
    // import graph reaches the client fails before its first assertion.
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'unit-test-anon-key',
    },
    exclude: [
      ...configDefaults.exclude,
      'tests/integration/**',
      // Deno test files from the sparse-checked-out backend (D-6); they use
      // Deno.test, not Vitest, and must never be swept into this run.
      '.supabase-backend/**',
    ],
  },
})
