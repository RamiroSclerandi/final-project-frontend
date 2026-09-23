import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom 30's HTMLDialogElementImpl ships `showModal`/`close` as no-ops that
// never toggle the `open` attribute or fire `close` (D8). Stub them only
// when genuinely missing, so a jsdom that later implements them for real is
// never silently overridden.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// Vitest doesn't run in `globals` mode here, so React Testing Library's
// auto-cleanup detection (which looks for a global `afterEach`) never fires.
// Without this, DOM from earlier tests in the same file leaks into later
// ones in any file with more than one test.
afterEach(() => {
  cleanup()
})
