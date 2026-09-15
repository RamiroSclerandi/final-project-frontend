import { defineConfig } from 'vitest/config'

// Integration tier (D-6): real `supabase start`, no DOM. Populated starting
// Phase 0b/1; zero matching files today is expected, not a failure.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.int.test.ts'],
    testTimeout: 20_000,
    // Files running in parallel share one local Postgres/Realtime instance;
    // under contention a wall-clock SLA assertion (REQ-RT-1, REQ-HS-2) can
    // fail even though the feature it measures is fine. One file at a time
    // keeps those assertions meaningful.
    fileParallelism: false,
    passWithNoTests: true,
  },
})
