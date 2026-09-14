import type { SequenceRenderer, SequenceRendererFrame } from '../animation-mode'
import { sampleExpressionSequence, type ExpressionSequence } from '../expression-sequence'
import type { SequenceTransitionStyle } from '../expression-sequence'
import { spriteAsset, type SpriteAssetPack } from './manifest'

export type SpriteSequenceFrame = SequenceRendererFrame & Readonly<{
  mode: 'sprite'
  packId: string
  variantId: string
  fromSource: string
  toSource: string
  transitionStyle: SequenceTransitionStyle
  progress: number
  inTransition: boolean
}>

export function spriteFrameForSequence(
  pack: SpriteAssetPack,
  variantId: string,
  sequence: ExpressionSequence,
  elapsedMs: number
): SpriteSequenceFrame {
  const sample = sampleExpressionSequence(sequence, elapsedMs)
  const fromSource = spriteAsset(pack, variantId, sample.from)
  const toSource = spriteAsset(pack, variantId, sample.to) ?? fromSource
  if (!fromSource) {
    throw new Error(`Sprite pack ${pack.id} does not provide ${sample.from} for variant ${variantId}`)
  }

  return {
    mode: 'sprite',
    sample,
    elapsedMs,
    packId: pack.id,
    variantId,
    fromSource,
    toSource: toSource ?? fromSource,
    transitionStyle: sequence.transitionStyle,
    progress: sample.inTransition ? sample.easedProgress : 0,
    inTransition: sample.inTransition && sample.from !== sample.to
  }
}

export function createSpriteSequenceRenderer(
  pack: SpriteAssetPack,
  variantId: string
): SequenceRenderer<SpriteSequenceFrame> {
  return {
    mode: 'sprite',
    label: `${pack.label} · ${variantId}`,
    frameAt: (sequence, elapsedMs) => spriteFrameForSequence(pack, variantId, sequence, elapsedMs)
  }
}
