import { describe, expect, it } from 'vitest'
import type { ExpressionSequence } from '../expression-sequence'
import { STELLA_SPRITE_PACK } from './stella-pack'
import { spriteAsset, validateSpriteAssetPack } from './manifest'
import { spriteFrameForSequence } from './sequence-renderer'

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

describe('Sprite Loop asset packs', () => {
  it('validates Stella as a reusable asset pack', () => {
    expect(validateSpriteAssetPack(STELLA_SPRITE_PACK)).toEqual([])
    expect(STELLA_SPRITE_PACK.variants).toHaveLength(3)
  })

  it('resolves assets without relying on catalog row math at render time', () => {
    expect(spriteAsset(STELLA_SPRITE_PACK, 'star-buns', 'wink'))
      .toBe('/assets/stella/stella-sprite-07.webp')
  })

  it('returns deterministic from/to sources for a transition', () => {
    const frame = spriteFrameForSequence(STELLA_SPRITE_PACK, 'plush-bob', sequence, 400)
    expect(frame.mode).toBe('sprite')
    expect(frame.sample.from).toBe('happy')
    expect(frame.sample.to).toBe('love')
    expect(frame.fromSource).toBe('/assets/stella/stella-sprite-00.webp')
    expect(frame.toSource).toBe('/assets/stella/stella-sprite-05.webp')
    expect(frame.progress).toBeCloseTo(0.5)
  })
})
