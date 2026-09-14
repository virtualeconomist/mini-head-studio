import { describe, expect, it } from 'vitest'
import { containRect, coverRect } from './backdrop'

describe('backdrop image layout', () => {
  it('covers a square canvas without leaving gaps', () => {
    expect(coverRect(1600, 900, 1000, 1000)).toEqual({
      x: expect.any(Number),
      y: 0,
      width: expect.closeTo(1777.7778, 3),
      height: 1000
    })
  })

  it('contains a landscape image inside a square canvas', () => {
    expect(containRect(1600, 900, 1000, 1000)).toEqual({
      x: 0,
      y: 218.75,
      width: 1000,
      height: 562.5
    })
  })
})
