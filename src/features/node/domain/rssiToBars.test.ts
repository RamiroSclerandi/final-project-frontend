import { describe, expect, it } from 'vitest'

import { rssiToBars } from './rssiToBars'

describe('rssiToBars', () => {
  it('returns 0 (unknown) for a null rssi', () => {
    expect(rssiToBars(null)).toBe(0)
  })

  it('returns 4 for rssi at or above -60', () => {
    expect(rssiToBars(-60)).toBe(4)
    expect(rssiToBars(-40)).toBe(4)
  })

  it('returns 3 for rssi between -70 and -60 exclusive of the -60 boundary', () => {
    expect(rssiToBars(-70)).toBe(3)
    expect(rssiToBars(-61)).toBe(3)
  })

  it('returns 2 for rssi between -80 and -70 exclusive of the -70 boundary', () => {
    expect(rssiToBars(-80)).toBe(2)
    expect(rssiToBars(-71)).toBe(2)
  })

  it('returns 1 for rssi between -90 and -80 exclusive of the -80 boundary', () => {
    expect(rssiToBars(-90)).toBe(1)
    expect(rssiToBars(-81)).toBe(1)
  })

  it('returns 0 (unknown) for rssi weaker than -90', () => {
    expect(rssiToBars(-91)).toBe(0)
    expect(rssiToBars(-120)).toBe(0)
  })
})
