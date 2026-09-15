import type { SequenceRenderer, SequenceRendererFrame } from '../animation-mode'
import { sampleExpressionSequence, type ExpressionSequence } from '../expression-sequence'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { type HairPlacement, type ModularHairId } from './hair'
import { type AccessoryId, type AccessoryPlacement } from './accessory'
import { interpolateFaceRigState } from './interpolate'
import { renderStellaCharacterSvg, renderStellaFaceFeaturesSvg } from './render-character'
import type { FaceRigState } from './types'

export type RigSequenceRenderOptions = Readonly<{
  hairId?: ModularHairId
  hairPlacement?: Partial<HairPlacement>
  hairSource?: string
  accessoryId?: AccessoryId
  accessoryPlacement?: Partial<AccessoryPlacement>
  assetSheetSource?: string
}>

export type RigSequenceFrame = SequenceRendererFrame & Readonly<{
  mode: 'rig'
  state: FaceRigState
  /** Compatibility SVG used only by the legacy source-mask hair experiment. */
  svg: string
  /** Raster-free parametric feature layer used by the real layered compositor. */
  faceSvg: string
  hairId: ModularHairId
  accessoryId: AccessoryId
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
    : interpolateFaceRigState(from, STELLA_EXPRESSION_PRESETS[sample.to], sample.easedProgress)
  const hairId = options.hairId ?? 'generated-classic-bob'
  const accessoryId = options.accessoryId ?? 'none'
  const label = `Rig sequence ${sample.from} to ${sample.to}`

  return {
    mode: 'rig',
    sample,
    elapsedMs,
    state,
    hairId,
    accessoryId,
    faceSvg: renderStellaFaceFeaturesSvg(state, `${label} face features`),
    svg: renderStellaCharacterSvg(state, {
      hairId,
      hairPlacement: options.hairPlacement,
      hairSource: options.hairSource,
      accessoryId: 'none',
      label
    })
  }
}

export const rigSequenceRenderer: SequenceRenderer<RigSequenceFrame> = {
  mode: 'rig',
  label: 'Stella Modular Rig',
  frameAt: (sequence, elapsedMs) => rigFrameForSequence(sequence, elapsedMs)
}
