import type { ExpressionSequence, ExpressionSequenceSample } from './expression-sequence'

export type AnimationModeId = 'sprite' | 'rig'

export type AnimationModeDefinition = Readonly<{
  id: AnimationModeId
  label: string
  shortLabel: string
  description: string
  bestFor: string
}>

export const ANIMATION_MODES: readonly AnimationModeDefinition[] = [
  {
    id: 'sprite',
    label: 'Sprite Loop',
    shortLabel: 'Sprite',
    description: 'Asset-driven frame loops using substitutable raster or illustrated expression packs.',
    bestFor: 'Fast prototypes, exact art direction, stickers, reactions and non-rigged characters.'
  },
  {
    id: 'rig',
    label: 'Modular Rig',
    shortLabel: 'Rig',
    description: 'Parameter-driven facial animation with continuous morphing between reusable expression states.',
    bestFor: 'Seamless expression morphs, reusable characters and future modular hair/accessory composition.'
  }
] as const

export type SequenceRendererFrame = Readonly<{
  mode: AnimationModeId
  sample: ExpressionSequenceSample
  elapsedMs: number
}>

/**
 * Renderer-independent sequence contract. A renderer answers one question:
 * "what should this animation look like at elapsed time T?"
 * Preview and export can then consume the same deterministic frame description.
 */
export type SequenceRenderer<TFrame extends SequenceRendererFrame> = Readonly<{
  mode: AnimationModeId
  label: string
  frameAt: (sequence: ExpressionSequence, elapsedMs: number) => TFrame
}>

export function animationModeDefinition(id: AnimationModeId) {
  return ANIMATION_MODES.find((mode) => mode.id === id) ?? ANIMATION_MODES[0]!
}
