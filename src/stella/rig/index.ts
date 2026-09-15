export { STELLA_EXPRESSION_PRESETS, getStellaExpressionPreset } from './expression-presets'
export {
  DEFAULT_HAIR_PLACEMENT,
  PLUSH_BOB_RASTER_SOURCE,
  STELLA_MODULAR_HAIRS,
  modularHairDefinition,
  modularHairSource,
  normalizeHairPlacement,
  renderStellaHairDefs,
  renderStellaHairLayer
} from './hair'
export { clamp01, interpolateFaceRigState, lerp } from './interpolate'
export { renderStellaCharacterSvg } from './render-character'
export { renderFaceRigSvg } from './render-svg'
export {
  createRigSequenceExport,
  rigStateForExpressionSequence
} from './sequence-export'
export {
  rigFrameForSequence,
  rigSequenceRenderer
} from './sequence-renderer'
export { STELLA_RIG_MANIFEST } from './stella-manifest'
export type {
  HairLayerPart,
  HairPlacement,
  ModularHairDefinition,
  ModularHairId
} from './hair'
export type { StellaCharacterRenderOptions } from './render-character'
export type {
  RigSequenceExportBackground,
  RigSequenceExportFormat,
  RigSequenceExportOptions
} from './sequence-export'
export type {
  RigSequenceFrame,
  RigSequenceRenderOptions
} from './sequence-renderer'
export type {
  BlushRigState,
  BrowRigState,
  CharacterRigManifest,
  ExpressionEffectsState,
  EyeRigState,
  EyeShapeWeights,
  FaceRigAnchors,
  FaceRigState,
  MouthRigState,
  Vec2
} from './types'
