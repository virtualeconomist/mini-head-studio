import type { ExpressionId } from '../catalog'
import type {
  BrowRigState,
  EyeRigState,
  EyeShapeWeights,
  FaceRigState,
  MouthRigState
} from './types'

const eyeShape = (
  oval = 0,
  arc = 0,
  heart = 0,
  chevron = 0
): EyeShapeWeights => ({ oval, arc, heart, chevron })

const eye = (overrides: Partial<EyeRigState> = {}): EyeRigState => ({
  openness: 1,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  pupilScale: 1,
  shape: eyeShape(1, 0, 0, 0),
  ...overrides
})

const brow = (overrides: Partial<BrowRigState> = {}): BrowRigState => ({
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  arch: 0.25,
  ...overrides
})

const mouth = (overrides: Partial<MouthRigState> = {}): MouthRigState => ({
  width: 1,
  openness: 0.05,
  smile: 0.75,
  roundness: 0.1,
  offsetY: 0,
  ...overrides
})

const base = (): FaceRigState => ({
  leftEye: eye(),
  rightEye: eye(),
  leftBrow: brow(),
  rightBrow: brow(),
  mouth: mouth(),
  blush: {
    opacity: 0.55,
    scale: 1
  },
  effects: {
    hearts: 0,
    sparkles: 0,
    tears: 0
  }
})

const happy: FaceRigState = base()

const wink: FaceRigState = {
  ...base(),
  leftEye: eye({
    openness: 0.05,
    scaleY: 0.4,
    shape: eyeShape(0, 1, 0, 0)
  }),
  rightEye: eye({
    openness: 1.05,
    scaleY: 1.03
  }),
  leftBrow: brow({ offsetY: -2, rotation: -0.08, arch: 0.42 }),
  rightBrow: brow({ offsetY: -3, rotation: 0.04, arch: 0.34 }),
  mouth: mouth({ width: 1.05, smile: 0.88 }),
  effects: {
    hearts: 0,
    sparkles: 0.25,
    tears: 0
  }
}

const surprised: FaceRigState = {
  ...base(),
  leftEye: eye({ openness: 1.18, scaleX: 1.04, scaleY: 1.14 }),
  rightEye: eye({ openness: 1.18, scaleX: 1.04, scaleY: 1.14 }),
  leftBrow: brow({ offsetY: -10, rotation: -0.04, arch: 0.62 }),
  rightBrow: brow({ offsetY: -10, rotation: 0.04, arch: 0.62 }),
  mouth: mouth({
    width: 0.58,
    openness: 0.95,
    smile: 0.05,
    roundness: 1,
    offsetY: 2
  }),
  blush: {
    opacity: 0.35,
    scale: 0.95
  },
  effects: {
    hearts: 0,
    sparkles: 0.1,
    tears: 0
  }
}

const cheeky: FaceRigState = {
  ...base(),
  leftEye: eye({
    openness: 0.55,
    scaleX: 1.08,
    rotation: -0.08,
    shape: eyeShape(0, 0, 0, 1)
  }),
  rightEye: eye({
    openness: 0.55,
    scaleX: 1.08,
    rotation: 0.08,
    shape: eyeShape(0, 0, 0, 1)
  }),
  leftBrow: brow({ offsetY: -3, rotation: -0.12, arch: 0.18 }),
  rightBrow: brow({ offsetY: -3, rotation: 0.12, arch: 0.18 }),
  mouth: mouth({ width: 1.12, smile: 0.92, openness: 0.08 }),
  blush: {
    opacity: 0.7,
    scale: 1.08
  },
  effects: {
    hearts: 0,
    sparkles: 0.4,
    tears: 0
  }
}

const sleepy: FaceRigState = {
  ...base(),
  leftEye: eye({
    openness: 0.08,
    scaleY: 0.5,
    offsetY: 3,
    shape: eyeShape(0, 1, 0, 0)
  }),
  rightEye: eye({
    openness: 0.08,
    scaleY: 0.5,
    offsetY: 3,
    shape: eyeShape(0, 1, 0, 0)
  }),
  leftBrow: brow({ offsetY: 3, rotation: -0.03, arch: 0.12 }),
  rightBrow: brow({ offsetY: 3, rotation: 0.03, arch: 0.12 }),
  mouth: mouth({
    width: 0.62,
    openness: 0,
    smile: 0.12,
    roundness: 0,
    offsetY: 1
  }),
  blush: {
    opacity: 0.28,
    scale: 0.92
  },
  effects: {
    hearts: 0,
    sparkles: 0,
    tears: 0
  }
}

const love: FaceRigState = {
  ...base(),
  leftEye: eye({
    openness: 1,
    scaleX: 1.12,
    scaleY: 1.08,
    pupilScale: 0,
    shape: eyeShape(0, 0, 1, 0)
  }),
  rightEye: eye({
    openness: 1,
    scaleX: 1.12,
    scaleY: 1.08,
    pupilScale: 0,
    shape: eyeShape(0, 0, 1, 0)
  }),
  leftBrow: brow({ offsetY: -4, rotation: -0.04, arch: 0.48 }),
  rightBrow: brow({ offsetY: -4, rotation: 0.04, arch: 0.48 }),
  mouth: mouth({ width: 1.08, smile: 0.9, openness: 0.08 }),
  blush: {
    opacity: 0.9,
    scale: 1.15
  },
  effects: {
    hearts: 1,
    sparkles: 0.3,
    tears: 0
  }
}

export const STELLA_EXPRESSION_PRESETS: Readonly<Record<ExpressionId, FaceRigState>> = {
  happy,
  wink,
  surprised,
  cheeky,
  sleepy,
  love
}

export function getStellaExpressionPreset(expression: ExpressionId): FaceRigState {
  return STELLA_EXPRESSION_PRESETS[expression]
}
