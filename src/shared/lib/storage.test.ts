import { afterEach, describe, expect, it, vi } from 'vitest'

import { readStorageItem, writeStorageItem } from './storage'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('readStorageItem', () => {
  it('returns the stored value', () => {
    localStorage.setItem('k', 'v')

    expect(readStorageItem('k')).toBe('v')
  })

  it('returns null when storage access throws a DOMException', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    expect(readStorageItem('k')).toBeNull()
  })

  it('rethrows a non-DOMException error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new TypeError('boom')
    })

    expect(() => readStorageItem('k')).toThrow(TypeError)
  })
})

describe('writeStorageItem', () => {
  it('writes the value', () => {
    writeStorageItem('k', 'v')

    expect(localStorage.getItem('k')).toBe('v')
  })

  it('does not throw when storage access throws a DOMException', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    expect(() => writeStorageItem('k', 'v')).not.toThrow()
  })

  it('rethrows a non-DOMException error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new TypeError('boom')
    })

    expect(() => writeStorageItem('k', 'v')).toThrow(TypeError)
  })
})
