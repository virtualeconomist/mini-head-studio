import { describe, expect, it } from 'vitest'
import { EXPRESSIONS } from './catalog'
import { createStellaFaceSvg } from './vector-face'

describe('vector Stella faces', () => {
  it('creates a standalone scalable SVG for every expression', () => {
    for (const expression of EXPRESSIONS) {
      const svg = createStellaFaceSvg(expression.id)
      expect(svg).toContain('<svg')
      expect(svg).toContain('viewBox="0 0 512 512"')
      expect(svg).toContain(`${expression.label} Stella expression`)
      expect(svg).not.toContain('<image')
    }
  })
})
