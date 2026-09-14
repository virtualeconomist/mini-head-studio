import { describe, expect, it } from 'vitest'
import { EXPRESSIONS } from '../catalog'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { clamp01, interpolateFaceRigState, lerp } from './interpolate'

function eyeWeightTotal(weights: {
  oval: number
  arc: number
  heart: number
  chevron: number
}) {
  return weights.oval + weights.arc + weights.heart + weights.chevron
}

describe('modular Stella face rig', () => {
  it('defines a rig state for every catalog expression', () => {
    for (const expression of EXPRESSIONS) {
      expect(STELLA_EXPRESSION_PRESETS[expression.id]).toBeDefined()
    }
  })

  it('keeps eye shape weights normalized for every preset', () => {
    for (const expression of EXPRESSIONS) {
      const preset = STELLA_EXPRESSION_PRESETS[expression.id]
      expect(eyeWeightTotal(preset.leftEye.shape)).toBeCloseTo(1)
      expect(eyeWeightTotal(preset.rightEye.shape)).toBeCloseTo(1)
    }
  })

  it('clamps interpolation progress', () => {
    expect(clamp01(-2)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(3)).toBe(1)
    expect(lerp(10, 20, -1)).toBe(10)
    expect(lerp(10, 20, 2)).toBe(20)
  })

  it('returns source and target states at the endpoints', () => {
    const from = STELLA_EXPRESSION_PRESETS.happy
    const to = STELLA_EXPRESSION_PRESETS.surprised

    expect(interpolateFaceRigState(from, to, 0)).toEqual(from)
    expect(interpolateFaceRigState(from, to, 1)).toEqual(to)
  })

  it('interpolates continuous expression parameters at the midpoint', () => {
    const from = STELLA_EXPRESSION_PRESETS.happy
    const to = STELLA_EXPRESSION_PRESETS.love
    const midpoint = interpolateFaceRigState(from, to, 0.5)

    expect(midpoint.leftEye.shape.oval).toBeCloseTo(0.5)
    expect(midpoint.leftEye.shape.heart).toBeCloseTo(0.5)
    expect(midpoint.effects.hearts).toBeCloseTo(0.5)
    expect(midpoint.blush.opacity).toBeCloseTo((from.blush.opacity + to.blush.opacity) / 2)
    expect(midpoint.mouth.smile).toBeCloseTo((from.mouth.smile + to.mouth.smile) / 2)
  })

  it('preserves normalized eye weights while blending between shape families', () => {
    const from = STELLA_EXPRESSION_PRESETS.cheeky
    const to = STELLA_EXPRESSION_PRESETS.love

    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const state = interpolateFaceRigState(from, to, progress)
      expect(eyeWeightTotal(state.leftEye.shape)).toBeCloseTo(1)
      expect(eyeWeightTotal(state.rightEye.shape)).toBeCloseTo(1)
    }
  })
})
