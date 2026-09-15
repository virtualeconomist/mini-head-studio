import { describe, expect, it } from 'vitest'
import type { ExpressionSequence } from '../expression-sequence'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { rigStateForExpressionSequence } from './sequence-export'

const sequence: ExpressionSequence = {
  steps: [
    { expression: 'happy', holdMs: 300 },
    { expression: 'love', holdMs: 300 }
  ],
  transitionMs: 200,
  easing: 'linear',
  easeStrength: 2,
  seamless: true,
  transitionStyle: 'crossfade'
}

describe('rig sequence export state', () => {
  it('uses the exact expression state during a hold', () => {
    expect(rigStateForExpressionSequence(sequence, 100)).toEqual(STELLA_EXPRESSION_PRESETS.happy)
  })

  it('interpolates the modular rig during a transition', () => {
    const state = rigStateForExpressionSequence(sequence, 400)
    expect(state.leftEye.shape.heart).toBeGreaterThan(0)
    expect(state.leftEye.shape.heart).toBeLessThan(STELLA_EXPRESSION_PRESETS.love.leftEye.shape.heart)
    expect(state.mouth.smile).not.toBe(STELLA_EXPRESSION_PRESETS.happy.mouth.smile)
  })

  it('wraps the seamless loop back to the opening state', () => {
    expect(rigStateForExpressionSequence(sequence, 1000)).toEqual(
      rigStateForExpressionSequence(sequence, 0)
    )
  })
})
