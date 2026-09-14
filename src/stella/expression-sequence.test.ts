import { describe, expect, it } from 'vitest'
import {
  expressionSequenceDurationMs,
  sampleExpressionSequence,
  sequenceFromStoredExpressionLoop,
  type ExpressionSequence
} from './expression-sequence'

const sequence: ExpressionSequence = {
  steps: [
    { expression: 'happy', holdMs: 300 },
    { expression: 'wink', holdMs: 300 },
    { expression: 'love', holdMs: 300 }
  ],
  transitionMs: 200,
  easing: 'ease-in-out',
  easeStrength: 2,
  seamless: true,
  transitionStyle: 'crossfade'
}

describe('expression sequence timeline', () => {
  it('includes the closing transition in seamless duration', () => {
    expect(expressionSequenceDurationMs(sequence)).toBe(1500)
  })

  it('holds the current expression before transitioning', () => {
    const sample = sampleExpressionSequence(sequence, 120)
    expect(sample.from).toBe('happy')
    expect(sample.to).toBe('happy')
    expect(sample.inTransition).toBe(false)
  })

  it('samples a transition between adjacent expressions', () => {
    const sample = sampleExpressionSequence(sequence, 400)
    expect(sample.from).toBe('happy')
    expect(sample.to).toBe('wink')
    expect(sample.inTransition).toBe(true)
    expect(sample.rawProgress).toBeCloseTo(0.5)
  })

  it('transitions the final expression back to the first when seamless', () => {
    const sample = sampleExpressionSequence(sequence, 1400)
    expect(sample.from).toBe('love')
    expect(sample.to).toBe('happy')
    expect(sample.inTransition).toBe(true)
  })

  it('wraps elapsed time deterministically', () => {
    expect(sampleExpressionSequence(sequence, 1600)).toEqual(sampleExpressionSequence(sequence, 100))
  })

  it('preserves every selected face and full duration from the existing Expression Loop', () => {
    const converted = sequenceFromStoredExpressionLoop({
      enabled: true,
      selected: ['happy', 'wink', 'cheeky', 'sleepy'],
      intervalMs: 700,
      transition: 'crossfade'
    })

    expect(converted).not.toBeNull()
    expect(converted!.steps.map((step) => step.expression)).toEqual([
      'happy',
      'wink',
      'cheeky',
      'sleepy'
    ])
    expect(expressionSequenceDurationMs(converted!)).toBe(2800)
  })
})
