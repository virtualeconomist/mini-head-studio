export type Vec2 = Readonly<{
  x: number
  y: number
}>

export type EyeShapeWeights = Readonly<{
  oval: number
  arc: number
  heart: number
  chevron: number
}>

export type EyeRigState = Readonly<{
  openness: number
  scaleX: number
  scaleY: number
  rotation: number
  offsetX: number
  offsetY: number
  pupilScale: number
  shape: EyeShapeWeights
}>

export type BrowRigState = Readonly<{
  offsetX: number
  offsetY: number
  rotation: number
  arch: number
}>

export type MouthRigState = Readonly<{
  width: number
  openness: number
  smile: number
  roundness: number
  offsetY: number
}>

export type BlushRigState = Readonly<{
  opacity: number
  scale: number
}>

export type ExpressionEffectsState = Readonly<{
  hearts: number
  sparkles: number
  tears: number
}>

export type FaceRigState = Readonly<{
  leftEye: EyeRigState
  rightEye: EyeRigState
  leftBrow: BrowRigState
  rightBrow: BrowRigState
  mouth: MouthRigState
  blush: BlushRigState
  effects: ExpressionEffectsState
}>

export type FaceRigAnchors = Readonly<{
  leftEye: Vec2
  rightEye: Vec2
  leftBrow: Vec2
  rightBrow: Vec2
  mouth: Vec2
  leftBlush: Vec2
  rightBlush: Vec2
}>

export type CharacterRigManifest = Readonly<{
  id: string
  label: string
  viewBox: Readonly<{
    width: number
    height: number
  }>
  anchors: FaceRigAnchors
}>
