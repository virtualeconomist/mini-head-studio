import { describe, expect, it } from 'vitest'
import type { ExpressionSequence } from '../expression-sequence'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { PLUSH_BOB_RASTER_SOURCE } from './hair'
import { STELLA_GENERATED_ASSET_SHEET } from './generated-assets'
import { renderStellaCharacterSvg, renderStellaFaceFeaturesSvg } from './render-character'
import { rigFrameForSequence } from './sequence-renderer'

describe('generated Stella character asset pack', () => {
  it('keeps the compatibility SVG capable of describing generated layers', () => {
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.happy, {
      hairId: 'generated-classic-bob',
      accessoryId: 'cat-bandana'
    })
    expect(svg).toContain('data-generated-asset="base-head"')
    expect(svg).toContain('data-generated-asset="classic-bob"')
    expect(svg).toContain('data-generated-asset="cat-bandana"')
    expect(svg).toContain(STELLA_GENERATED_ASSET_SHEET)
    expect(svg).not.toContain(PLUSH_BOB_RASTER_SOURCE)
  })

  it('exposes a raster-free face-feature SVG for the real layered compositor', () => {
    const svg = renderStellaFaceFeaturesSvg(STELLA_EXPRESSION_PRESETS.wink)
    expect(svg).toContain('data-character-layer="face-rig-features"')
    expect(svg).not.toContain('data-generated-asset=')
    expect(svg).not.toContain('<image')
    expect(svg).not.toContain('M96 224')
  })

  it('returns face features independently from hair/accessory selection', () => {
    const sequence: ExpressionSequence = {
      steps: [
        { expression: 'happy', holdMs: 400 },
        { expression: 'love', holdMs: 400 }
      ],
      transitionMs: 300,
      easing: 'ease-in-out',
      easeStrength: 2,
      seamless: true,
      transitionStyle: 'crossfade'
    }
    const frame = rigFrameForSequence(sequence, 500, {
      hairId: 'generated-star-buns',
      accessoryId: 'cat-bandana'
    })
    expect(frame.hairId).toBe('generated-star-buns')
    expect(frame.accessoryId).toBe('cat-bandana')
    expect(frame.faceSvg).toContain('data-character-layer="face-rig-features"')
    expect(frame.faceSvg).not.toContain(STELLA_GENERATED_ASSET_SHEET)
  })

  it('supports generated star buns and orange bob as substitutable layers', () => {
    const star = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.wink, { hairId: 'generated-star-buns' })
    const orange = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.love, { hairId: 'generated-orange-bob' })
    expect(star).toContain('data-generated-asset="star-buns"')
    expect(orange).toContain('data-generated-asset="orange-bob"')
  })

  it('keeps the earlier source-mask Plush Bob available as a legacy option', () => {
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.cheeky, { hairId: 'plush-bob' })
    expect(svg).toContain(PLUSH_BOB_RASTER_SOURCE)
    expect(svg).toContain('data-hair-source="raster"')
  })
})
