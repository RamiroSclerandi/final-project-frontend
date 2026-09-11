import { defineConfig } from 'vitest/config'

// Integration tier (D-6): real `supabase start`, no DOM. Populated starting
// Phase 0b/1; zero matching files today is expected, not a failure.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.int.test.ts'],
    testTimeout: 20_000,
    passWithNoTests: true,
  },
})
