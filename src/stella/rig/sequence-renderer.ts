import type { SequenceRenderer, SequenceRendererFrame } from '../animation-mode'
import { sampleExpressionSequence, type ExpressionSequence } from '../expression-sequence'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { type HairPlacement, type ModularHairId } from './hair'
import { interpolateFaceRigState } from './interpolate'
import { renderStellaCharacterSvg } from './render-character'
import type { FaceRigState } from './types'

export type RigSequenceRenderOptions = Readonly<{
  hairId?: ModularHairId
  hairPlacement?: Partial<HairPlacement>
  hairSource?: string
}>

export type RigSequenceFrame = SequenceRendererFrame & Readonly<{
  mode: 'rig'
  state: FaceRigState
  svg: string
  hairId: ModularHairId
}>

export function rigFrameForSequence(
  sequence: ExpressionSequence,
  elapsedMs: number,
  options: RigSequenceRenderOptions = {}
): RigSequenceFrame {
  const sample = sampleExpressionSequence(sequence, elapsedMs)
  const from = STELLA_EXPRESSION_PRESETS[sample.from]
  const state = !sample.inTransition || sample.from === sample.to
    ? from
    : interpolateFaceRigState(
      from,
      STELLA_EXPRESSION_PRESETS[sample.to],
      sample.easedProgress
    )
  const hairId = options.hairId ?? 'plush-bob'

  return {
    mode: 'rig',
    sample,
    elapsedMs,
    state,
    hairId,
    svg: renderStellaCharacterSvg(state, {
      hairId,
      hairPlacement: options.hairPlacement,
      hairSource: options.hairSource,
      label: `Rig sequence ${sample.from} to ${sample.to}`
    })
  }
}

export const rigSequenceRenderer: SequenceRenderer<RigSequenceFrame> = {
  mode: 'rig',
  label: 'Stella Modular Rig',
  frameAt: (sequence, elapsedMs) => rigFrameForSequence(sequence, elapsedMs)
}
