/**
 * Canonical English dictionary (D9). A plain object, not `as const`, so leaf
 * values stay typed as `string` and `Dictionary` (in `../dictionary.ts`)
 * derives its shape from this file.
 *
 * Empty for PR-1: this PR only builds the i18n infrastructure (provider,
 * translate, format) and touches no UI copy. Per the tasks cross-PR
 * invariant, a key is added in the same task as the component that first
 * consumes it -- starting with the design-system atoms/molecules in PR-2.
 */
export const en = {}
