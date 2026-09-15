import { describe, expect, it } from 'vitest'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import {
  PLUSH_BOB_FACE_OPENING_ID,
  PLUSH_BOB_RASTER_SOURCE,
  renderStellaHairLayer
} from './hair'
import { renderStellaCharacterSvg } from './render-character'

describe('modular Stella character shell', () => {
  it('composes source raster back hair, clipped face rig, then source raster fringe', () => {
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.happy, { hairId: 'plush-bob' })
    const back = svg.indexOf('data-hair-layer="back"')
    const face = svg.indexOf('data-character-layer="face-rig"')
    const front = svg.indexOf('data-hair-layer="front"')

    expect(back).toBeGreaterThan(-1)
    expect(face).toBeGreaterThan(back)
    expect(front).toBeGreaterThan(face)
    expect(svg).toContain('data-hair="plush-bob"')
    expect(svg).toContain('data-hair-source="raster"')
    expect(svg).toContain(PLUSH_BOB_RASTER_SOURCE)
    expect(svg).toContain('plush-bob-back-mask')
    expect(svg).toContain(`clip-path="url(#${PLUSH_BOB_FACE_OPENING_ID})"`)
  })

  it('can render the same face rig without hair or face clipping', () => {
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.love, { hairId: 'none' })
    expect(svg).toContain('data-hair="none"')
    expect(svg).not.toContain('data-hair-layer=')
    expect(svg).not.toContain(PLUSH_BOB_RASTER_SOURCE)
    expect(svg).toContain('data-character-layer="face-rig"')
    expect(svg).not.toContain(`url(#${PLUSH_BOB_FACE_OPENING_ID})`)
  })

  it('keeps source hair markup independent from expression state', () => {
    const back = renderStellaHairLayer('plush-bob', 'back')
    const front = renderStellaHairLayer('plush-bob', 'front')
    expect(back).toContain('data-hair-layer="back"')
    expect(front).toContain('data-hair-layer="front"')
    expect(back + front).toContain(PLUSH_BOB_RASTER_SOURCE)
    expect(back + front).not.toContain('happy')
    expect(back + front).not.toContain('love')
  })

  it('accepts an inlined export-safe raster source', () => {
    const source = 'data:image/webp;base64,AAAA'
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.wink, {
      hairId: 'plush-bob',
      hairSource: source
    })
    expect(svg).toContain(source)
    expect(svg).not.toContain(PLUSH_BOB_RASTER_SOURCE)
  })

  it('moves the face opening with hair placement', () => {
    const svg = renderStellaCharacterSvg(STELLA_EXPRESSION_PRESETS.happy, {
      hairId: 'plush-bob',
      hairPlacement: { offsetX: 12, offsetY: -8, scale: 1.05, rotation: 2 }
    })
    expect(svg).toContain('translate(12 -8) translate(256 256) rotate(2) scale(1.05)')
  })
})
