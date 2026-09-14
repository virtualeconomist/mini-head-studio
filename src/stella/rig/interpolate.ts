import type {
  BrowRigState,
  EyeRigState,
  EyeShapeWeights,
  FaceRigState,
  MouthRigState
} from './types'

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function lerp(from: number, to: number, t: number) {
  const progress = clamp01(t)
  return from + (to - from) * progress
}

function interpolateShape(from: EyeShapeWeights, to: EyeShapeWeights, t: number): EyeShapeWeights {
  return {
    oval: lerp(from.oval, to.oval, t),
    arc: lerp(from.arc, to.arc, t),
    heart: lerp(from.heart, to.heart, t),
    chevron: lerp(from.chevron, to.chevron, t)
  }
}

function interpolateEye(from: EyeRigState, to: EyeRigState, t: number): EyeRigState {
  return {
    openness: lerp(from.openness, to.openness, t),
    scaleX: lerp(from.scaleX, to.scaleX, t),
    scaleY: lerp(from.scaleY, to.scaleY, t),
    rotation: lerp(from.rotation, to.rotation, t),
    offsetX: lerp(from.offsetX, to.offsetX, t),
    offsetY: lerp(from.offsetY, to.offsetY, t),
    pupilScale: lerp(from.pupilScale, to.pupilScale, t),
    shape: interpolateShape(from.shape, to.shape, t)
  }
}

function interpolateBrow(from: BrowRigState, to: BrowRigState, t: number): BrowRigState {
  return {
    offsetX: lerp(from.offsetX, to.offsetX, t),
    offsetY: lerp(from.offsetY, to.offsetY, t),
    rotation: lerp(from.rotation, to.rotation, t),
    arch: lerp(from.arch, to.arch, t)
  }
}

function interpolateMouth(from: MouthRigState, to: MouthRigState, t: number): MouthRigState {
  return {
    width: lerp(from.width, to.width, t),
    openness: lerp(from.openness, to.openness, t),
    smile: lerp(from.smile, to.smile, t),
    roundness: lerp(from.roundness, to.roundness, t),
    offsetY: lerp(from.offsetY, to.offsetY, t)
  }
}

/**
 * Pure renderer-independent interpolation primitive.
 *
 * The caller owns easing. This function only blends two expression states and
 * deliberately returns a new object so preview/export code can share it safely.
 */
export function interpolateFaceRigState(
  from: FaceRigState,
  to: FaceRigState,
  t: number
): FaceRigState {
  const progress = clamp01(t)
  return {
    leftEye: interpolateEye(from.leftEye, to.leftEye, progress),
    rightEye: interpolateEye(from.rightEye, to.rightEye, progress),
    leftBrow: interpolateBrow(from.leftBrow, to.leftBrow, progress),
    rightBrow: interpolateBrow(from.rightBrow, to.rightBrow, progress),
    mouth: interpolateMouth(from.mouth, to.mouth, progress),
    blush: {
      opacity: lerp(from.blush.opacity, to.blush.opacity, progress),
      scale: lerp(from.blush.scale, to.blush.scale, progress)
    },
    effects: {
      hearts: lerp(from.effects.hearts, to.effects.hearts, progress),
      sparkles: lerp(from.effects.sparkles, to.effects.sparkles, progress),
      tears: lerp(from.effects.tears, to.effects.tears, progress)
    }
  }
}
