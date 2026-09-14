import type { CharacterRigManifest } from './types'

/**
 * Character-specific layout data for Stella.
 *
 * Expression presets intentionally do not own absolute coordinates. This keeps
 * the same expression vocabulary reusable if Stella gets new hair assets or if
 * a future character provides a different anchor manifest.
 */
export const STELLA_RIG_MANIFEST: CharacterRigManifest = {
  id: 'stella',
  label: 'Stella',
  viewBox: {
    width: 512,
    height: 512
  },
  anchors: {
    leftEye: { x: 199, y: 251 },
    rightEye: { x: 313, y: 251 },
    leftBrow: { x: 199, y: 211 },
    rightBrow: { x: 313, y: 211 },
    mouth: { x: 256, y: 330 },
    leftBlush: { x: 166, y: 307 },
    rightBlush: { x: 346, y: 307 }
  }
} as const
