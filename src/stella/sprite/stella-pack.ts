import { EXPRESSIONS, HAIRS, spritePath } from '../catalog'
import type { ExpressionId } from '../catalog'
import type { SpriteAssetPack } from './manifest'

function assetsForHair(hairId: (typeof HAIRS)[number]['id']) {
  return Object.fromEntries(
    EXPRESSIONS.map((expression) => [expression.id, spritePath(hairId, expression.id)])
  ) as Record<ExpressionId, string>
}

export const STELLA_SPRITE_PACK: SpriteAssetPack = {
  id: 'stella-v1',
  label: 'Stella · Original Sprites',
  description: 'The current Mini Head Studio raster expression set, preserved as a reusable Sprite Loop pack.',
  version: 1,
  author: 'Mini Head Studio',
  defaultVariantId: 'plush-bob',
  defaultSequence: ['happy', 'wink', 'cheeky', 'love'],
  supportedTransitions: ['crossfade', 'pop', 'blink', 'snap'],
  variants: HAIRS.map((hair) => ({
    id: hair.id,
    label: hair.label,
    detail: hair.detail,
    assets: assetsForHair(hair.id)
  }))
}

/** Registry intentionally supports more packs without changing the sequencer. */
export const SPRITE_ASSET_PACKS: readonly SpriteAssetPack[] = [STELLA_SPRITE_PACK]

export function spriteAssetPack(packId: string) {
  return SPRITE_ASSET_PACKS.find((pack) => pack.id === packId) ?? SPRITE_ASSET_PACKS[0]!
}
