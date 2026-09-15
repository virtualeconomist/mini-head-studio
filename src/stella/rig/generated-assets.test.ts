import { describe, expect, it } from 'vitest'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { PLUSH_BOB_RASTER_SOURCE } from './hair'
import { STELLA_GENERATED_ASSET_SHEET } from './generated-assets'
import { renderStellaCharacterSvg } from './render-character'

describe('generated Stella character asset pack', () => {
  it('composes generated base head, selected hair and accessory', () => {
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
