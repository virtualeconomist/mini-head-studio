import { describe, expect, it } from 'vitest'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { interpolateFaceRigState } from './interpolate'
import { renderFaceRigSvg } from './render-svg'
import { STELLA_RIG_MANIFEST } from './stella-manifest'

describe('renderFaceRigSvg', () => {
  it('renders a standalone SVG from a preset state', () => {
    const svg = renderFaceRigSvg(
      STELLA_RIG_MANIFEST,
      STELLA_EXPRESSION_PRESETS.happy,
      'Happy rig preview'
    )

    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox="0 0 512 512"')
    expect(svg).toContain('Happy rig preview')
    expect(svg).not.toContain('<image')
  })

  it('renders a true interpolated state rather than selecting one endpoint', () => {
    const midpoint = interpolateFaceRigState(
      STELLA_EXPRESSION_PRESETS.happy,
      STELLA_EXPRESSION_PRESETS.love,
      0.5
    )

    expect(midpoint.leftEye.shape.oval).toBeCloseTo(0.5)
    expect(midpoint.leftEye.shape.heart).toBeCloseTo(0.5)

    const svg = renderFaceRigSvg(STELLA_RIG_MANIFEST, midpoint, 'Happy to Love midpoint')
    expect(svg).toContain('opacity="0.500"')
    expect(svg).toContain('Happy to Love midpoint')
  })
})
