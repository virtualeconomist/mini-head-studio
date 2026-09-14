import type { MotionId } from './catalog'

export interface MotionPose {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

interface Keyframe extends MotionPose {
  at: number
}

const pose = (
  at: number,
  y = 0,
  rotation = 0,
  scaleX = 1,
  scaleY = scaleX,
  x = 0
): Keyframe => ({ at, x, y, rotation, scaleX, scaleY })

const FRAMES: Record<MotionId, Keyframe[]> = {
  idle: [pose(0), pose(0.5, -0.025, 0, 1.018, 0.99), pose(1)],
  bounce: [
    pose(0),
    pose(0.35, -0.11, -2, 0.98, 1.04),
    pose(0.62, 0, 0, 1.04, 0.94),
    pose(0.78, -0.03, 1),
    pose(1)
  ],
  pop: [pose(0, 0, 0, 0.82), pose(0.32, 0, -2, 1.12), pose(0.54, 0, 1, 0.98), pose(0.7, 0, 0, 1.025), pose(1, 0, 0, 0.82)],
  sway: [pose(0, 0, -4), pose(0.5, -0.02, 4), pose(1, 0, -4)],
  spin: [pose(0, 0, 0, 0.95), pose(0.72, 0, 370, 1.03), pose(1, 0, 360)],
  float: [pose(0, 0.04, -1), pose(0.5, -0.05, 1), pose(1, 0.04, -1)],
  // Live preview follows the pointer. Exports use this intentional look-around loop.
  follow: [pose(0, 0, -4, 1, 1, -0.04), pose(0.25, -0.025, 2, 1.01, 0.99, 0.035), pose(0.5, 0.02, 4, 1, 1, 0.04), pose(0.75, -0.018, -2, 1.01, 0.99, -0.025), pose(1, 0, -4, 1, 1, -0.04)]
}

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const smooth = (amount: number) => amount * amount * (3 - 2 * amount)

/** Samples the same key poses used by the CSS preview for deterministic exports. */
export function motionPose(motion: MotionId, progress: number): MotionPose {
  const normalized = ((progress % 1) + 1) % 1
  const frames = FRAMES[motion]
  const nextIndex = frames.findIndex((frame) => frame.at > normalized)
  const right = frames[nextIndex < 0 ? frames.length - 1 : nextIndex]!
  const left = frames[Math.max(0, (nextIndex < 0 ? frames.length : nextIndex) - 1)]!
  const span = right.at - left.at || 1
  const amount = smooth((normalized - left.at) / span)

  return {
    x: mix(left.x, right.x, amount),
    y: mix(left.y, right.y, amount),
    rotation: mix(left.rotation, right.rotation, amount),
    scaleX: mix(left.scaleX, right.scaleX, amount),
    scaleY: mix(left.scaleY, right.scaleY, amount)
  }
}
