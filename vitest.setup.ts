import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest doesn't run in `globals` mode here, so React Testing Library's
// auto-cleanup detection (which looks for a global `afterEach`) never fires.
// Without this, DOM from earlier tests in the same file leaks into later
// ones in any file with more than one test.
afterEach(() => {
  cleanup()
})
