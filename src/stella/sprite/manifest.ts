import type { ExpressionId } from '../catalog'
import type { SequenceTransitionStyle } from '../expression-sequence'

export type SpriteAssetVariant = Readonly<{
  id: string
  label: string
  detail?: string
  assets: Readonly<Partial<Record<ExpressionId, string>>>
}>

export type SpriteAssetPack = Readonly<{
  id: string
  label: string
  description: string
  version: number
  author?: string
  defaultVariantId: string
  defaultSequence: readonly ExpressionId[]
  supportedTransitions: readonly SequenceTransitionStyle[]
  variants: readonly SpriteAssetVariant[]
}>

export function spriteVariant(pack: SpriteAssetPack, variantId: string) {
  return pack.variants.find((variant) => variant.id === variantId)
    ?? pack.variants.find((variant) => variant.id === pack.defaultVariantId)
    ?? pack.variants[0]
}

export function spriteAsset(
  pack: SpriteAssetPack,
  variantId: string,
  expression: ExpressionId
) {
  const variant = spriteVariant(pack, variantId)
  return variant?.assets[expression] ?? null
}

export function availableSpriteExpressions(pack: SpriteAssetPack, variantId: string) {
  const variant = spriteVariant(pack, variantId)
  if (!variant) return [] as ExpressionId[]
  return Object.keys(variant.assets) as ExpressionId[]
}

export function validateSpriteAssetPack(pack: SpriteAssetPack) {
  const issues: string[] = []
  if (!pack.id.trim()) issues.push('Pack id is required')
  if (!pack.label.trim()) issues.push('Pack label is required')
  if (!pack.variants.length) issues.push('At least one variant is required')
  if (!pack.variants.some((variant) => variant.id === pack.defaultVariantId)) {
    issues.push('Default variant must exist in variants')
  }
  for (const variant of pack.variants) {
    if (!variant.id.trim()) issues.push('Variant id is required')
    if (Object.keys(variant.assets).length < 2) {
      issues.push(`Variant ${variant.id || '(unnamed)'} needs at least two expression assets`)
    }
  }
  return issues
}
