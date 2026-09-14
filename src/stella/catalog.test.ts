import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXPRESSIONS, HAIRS, spritePath } from './catalog'

describe('Stella sprite catalogue', () => {
  it('maps every hair and expression combination to a unique asset', () => {
    const paths = HAIRS.flatMap((hair) =>
      EXPRESSIONS.map((expression) => spritePath(hair.id, expression.id))
    )

    expect(paths).toHaveLength(18)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('only references production assets that exist', () => {
    for (const hair of HAIRS) {
      for (const expression of EXPRESSIONS) {
        const path = spritePath(hair.id, expression.id)
        expect(existsSync(join(process.cwd(), 'public', path.slice(1))), path).toBe(true)
      }
    }
  })

  it('only references non-empty production assets', () => {
    for (const hair of HAIRS) {
      for (const expression of EXPRESSIONS) {
        const path = spritePath(hair.id, expression.id)
        expect(statSync(join(process.cwd(), 'public', path.slice(1))).size, path).toBeGreaterThan(0)
      }
    }
  })
})
