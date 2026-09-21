import type { Dictionary } from '../dictionary'

/**
 * Spanish dictionary (D9). Typed against `Dictionary` so a missing or extra
 * key is a compile error; `dictionaries.parity.test.ts` is the runtime
 * regression guard for the same invariant.
 */
export const es: Dictionary = {}
