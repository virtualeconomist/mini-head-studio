import type { SequenceRenderer, SequenceRendererFrame } from '../animation-mode'
import { sampleExpressionSequence, type ExpressionSequence } from '../expression-sequence'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { interpolateFaceRigState } from './interpolate'
import { renderFaceRigSvg } from './render-svg'
import { STELLA_RIG_MANIFEST } from './stella-manifest'
import type { FaceRigState } from './types'

export type RigSequenceFrame = SequenceRendererFrame & Readonly<{
  mode: 'rig'
  state: FaceRigState
  svg: string
}>

export function rigFrameForSequence(
  sequence: ExpressionSequence,
  elapsedMs: number
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

  return {
    mode: 'rig',
    sample,
    elapsedMs,
    state,
    svg: renderFaceRigSvg(
      STELLA_RIG_MANIFEST,
      state,
      `Rig sequence ${sample.from} to ${sample.to}`
    )
  }
}

export const rigSequenceRenderer: SequenceRenderer<RigSequenceFrame> = {
  mode: 'rig',
  label: 'Stella Modular Rig',
  frameAt: rigFrameForSequence
}
