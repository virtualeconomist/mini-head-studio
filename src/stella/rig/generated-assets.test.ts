import { describe, expect, it } from 'vitest'
import type { ExpressionSequence } from '../expression-sequence'
import { accessoryDefinition } from './accessory'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import {
  STELLA_GENERATED_ASSETS,
  STELLA_GENERATED_ASSET_SHEET,
  generatedAssetImageStyle,
  generatedAssetTransformStyle,
  layerCssTransform
} from './generated-assets'
import { PLUSH_BOB_RASTER_SOURCE, modularHairDefinition } from './hair'
import { renderStellaCharacterSvg, renderStellaFaceFeaturesSvg } from './render-character'
import { rigCompositeLayerOrder } from './sequence-export'
import { rigFrameForSequence } from './sequence-renderer'

describe('generated Stella character asset pack', () => {
  it('resolves the generated base head as a real raster-sheet img layer', () => {
    expect(STELLA_GENERATED_ASSETS['base-head']).toMatchObject({ kind: 'base', cell: 0 })
    expect(STELLA_GENERATED_ASSET_SHEET).toBe('/assets/stella/generated/asset-sheet.webp')
    expect(generatedAssetImageStyle('base-head')).toMatchObject({
      position: 'absolute',
      left: '0',
      top: '0%',
      width: '100%',
      height: '600%',
      maxWidth: 'none'
    })
  })

  it('resolves every generated hair selection to the expected raster asset and img crop', () => {
    expect(modularHairDefinition('generated-classic-bob')?.generatedAsset).toBe('classic-bob')
    expect(modularHairDefinition('generated-star-buns')?.generatedAsset).toBe('star-buns')
    expect(modularHairDefinition('generated-orange-bob')?.generatedAsset).toBe('orange-bob')
    expect(modularHairDefinition('generated-cat-bob')?.generatedAsset).toBe('cat-bob')
    expect(generatedAssetImageStyle('star-buns').top).toBe('-100%')
    expect(generatedAssetImageStyle('orange-bob').top).toBe('-200%')
    expect(generatedAssetImageStyle('cat-bob').top).toBe('-300%')
    expect(generatedAssetImageStyle('classic-bob').top).toBe('-400%')
  })

  it('resolves the White Cat Bandana as the accessory raster img layer', () => {
    expect(accessoryDefinition('cat-bandana')?.generatedAsset).toBe('cat-bandana')
    expect(generatedAssetImageStyle('cat-bandana').top).toBe('-500%')
  })

  it('keeps CSS placement transforms deterministic in 512-space', () => {
    const placement = { offsetX: 24, offsetY: -12, scale: 1.1, rotation: 6 }
    const expected = 'translate(4.6875%, -2.34375%) rotate(6deg) scale(1.1)'
    expect(layerCssTransform(placement)).toBe(expected)
    expect(generatedAssetTransformStyle(placement)).toEqual({
      transform: expected,
      transformOrigin: '50% 50%'
    })
  })

  it('keeps generated raster assets out of the compatibility SVG', () => {
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.happy, {
      hairId: 'generated-classic-bob',
      accessoryId: 'cat-bandana'
    })
    expect(svg).toContain('data-character-layer="face-rig-features"')
    expect(svg).not.toContain('<image')
    expect(svg).not.toContain(STELLA_GENERATED_ASSET_SHEET)
  })

  it('exposes a raster-free face-feature SVG for the DOM/canvas compositor', () => {
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
    expect(frame.svg).not.toContain(STELLA_GENERATED_ASSET_SHEET)
  })

  it('uses the required export layer order for generated and legacy characters', () => {
    expect(rigCompositeLayerOrder('generated-classic-bob', 'cat-bandana')).toEqual([
      'base-head',
      'face-rig',
      'hair',
      'accessory'
    ])
    expect(rigCompositeLayerOrder('none', 'cat-bandana')).toEqual([
      'base-head',
      'face-rig',
      'accessory'
    ])
    expect(rigCompositeLayerOrder('plush-bob', 'cat-bandana')).toEqual([
      'legacy-character',
      'accessory'
    ])
  })

  it('keeps the earlier source-mask Plush Bob available as a legacy option', () => {
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.cheeky, { hairId: 'plush-bob' })
    expect(svg).toContain(PLUSH_BOB_RASTER_SOURCE)
    expect(svg).toContain('data-hair-source="raster"')
  })
})
