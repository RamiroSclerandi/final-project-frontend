/**
 * Canonical English dictionary (D9). A plain object, not `as const`, so leaf
 * values stay typed as `string` and `Dictionary` (in `../dictionary.ts`)
 * derives its shape from this file.
 *
 * Per the tasks cross-PR invariant, a key is added in the same task as the
 * component that first consumes it -- these sections were added in PR-2 by
 * `StatusChip` (status.*) and `LocaleToggle`/`ThemeToggle` (shell.*).
 */
export const en = {
  shell: {
    locale: {
      label: 'Language',
      es: 'Español',
      en: 'English',
    },
    theme: {
      toggle: 'Toggle theme',
    },
  },
  status: {
    online: 'Online',
    offline: 'Offline',
    unknown: 'Unknown',
  },
}
