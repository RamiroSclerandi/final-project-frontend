import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// Unit tier (D-6): jsdom for components, plain Node for scripts/** tests.
// Real-database integration tests live under tests/integration and run
// through vitest.config.integration.ts instead.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/integration/**'],
  },
})
