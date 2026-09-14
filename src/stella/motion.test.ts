import { describe, expect, it } from 'vitest'
import { motionPose } from './motion'

describe('Stella motion sampling', () => {
  it('centers the idle motion at the beginning of its loop', () => {
    expect(motionPose('idle', 0)).toEqual({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 })
  })

  it('samples the visible midpoint poses', () => {
    expect(motionPose('idle', 0.5).y).toBeCloseTo(-0.025)
    expect(motionPose('sway', 0.5).rotation).toBeCloseTo(4)
    expect(motionPose('float', 0.5).y).toBeCloseTo(-0.05)
    expect(motionPose('follow', 0.5).x).toBeCloseTo(0.04)
  })

  it('wraps cleanly at the loop boundary', () => {
    expect(motionPose('bounce', 1)).toEqual(motionPose('bounce', 0))
    expect(motionPose('spin', 1).rotation).toBe(0)
  })
})
