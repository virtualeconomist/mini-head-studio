import type {
  CharacterRigManifest,
  EyeRigState,
  EyeShapeWeights,
  FaceRigState
} from './types'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const mix = (from: number, to: number, t: number) => from + (to - from) * t

function normalizedShape(shape: EyeShapeWeights): EyeShapeWeights {
  const total = shape.oval + shape.arc + shape.heart + shape.chevron
  if (total <= 0) return { oval: 1, arc: 0, heart: 0, chevron: 0 }
  return {
    oval: shape.oval / total,
    arc: shape.arc / total,
    heart: shape.heart / total,
    chevron: shape.chevron / total
  }
}

function ovalPath(cx: number, cy: number, rx: number, ry: number) {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`
}

function arcPath(cx: number, cy: number, width: number, height: number) {
  return `M ${cx - width / 2} ${cy} Q ${cx} ${cy + height} ${cx + width / 2} ${cy}`
}

function chevronPath(cx: number, cy: number, width: number, height: number) {
  return `M ${cx - width / 2} ${cy - height / 2} L ${cx} ${cy + height / 2} L ${cx + width / 2} ${cy - height / 2}`
}

function heartPath(cx: number, cy: number, scale: number) {
  const s = scale
  return `M ${cx} ${cy + 18 * s}
    C ${cx - 30 * s} ${cy - 2 * s}, ${cx - 36 * s} ${cy - 26 * s}, ${cx - 18 * s} ${cy - 36 * s}
    C ${cx - 6 * s} ${cy - 43 * s}, ${cx} ${cy - 34 * s}, ${cx} ${cy - 28 * s}
    C ${cx} ${cy - 34 * s}, ${cx + 7 * s} ${cy - 43 * s}, ${cx + 19 * s} ${cy - 36 * s}
    C ${cx + 37 * s} ${cy - 26 * s}, ${cx + 30 * s} ${cy - 2 * s}, ${cx} ${cy + 18 * s} Z`
}

function renderEye(eye: EyeRigState, anchor: { x: number; y: number }, gradientId: string) {
  const shape = normalizedShape(eye.shape)
  const cx = anchor.x + eye.offsetX
  const cy = anchor.y + eye.offsetY
  const width = 46 * eye.scaleX
  const openness = clamp(eye.openness, 0, 1.25)
  const ovalRy = mix(2.2, 30, clamp(openness, 0, 1)) * eye.scaleY
  const arcHeight = mix(1, 14, clamp(1 - openness, 0, 1))
  const chevronHeight = mix(10, 28, clamp(1 - openness * 0.35, 0, 1))
  const rotationDeg = (eye.rotation * 180) / Math.PI

  return `<g transform="rotate(${rotationDeg.toFixed(2)} ${cx} ${cy})">
    <path d="${ovalPath(cx, cy, width / 2, ovalRy)}" fill="url(#${gradientId})" opacity="${shape.oval.toFixed(3)}"/>
    <path d="${arcPath(cx, cy, width, arcHeight)}" fill="none" stroke="#171514" stroke-width="9" stroke-linecap="round" opacity="${shape.arc.toFixed(3)}"/>
    <path d="${chevronPath(cx, cy, width, chevronHeight)}" fill="none" stroke="#171514" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="${shape.chevron.toFixed(3)}"/>
    <path d="${heartPath(cx, cy + 4, 0.88 * eye.scaleX)}" fill="#d93333" opacity="${shape.heart.toFixed(3)}"/>
    ${shape.oval > 0.01 && eye.pupilScale > 0.01 && openness > 0.18
      ? `<ellipse cx="${cx - 4}" cy="${cy - 7}" rx="${Math.max(2, 5 * eye.pupilScale)}" ry="${Math.max(2, 7 * eye.pupilScale)}" fill="#fff" opacity=".84"/>`
      : ''}
  </g>`
}

function renderBrow(
  anchor: { x: number; y: number },
  brow: FaceRigState['leftBrow']
) {
  const cx = anchor.x + brow.offsetX
  const cy = anchor.y + brow.offsetY
  const rise = mix(3, 18, clamp(brow.arch, 0, 1))
  const rotationDeg = (brow.rotation * 180) / Math.PI
  return `<path d="M ${cx - 25} ${cy + 2} Q ${cx} ${cy - rise} ${cx + 25} ${cy + 2}"
    fill="none" stroke="#8f6654" stroke-width="8" stroke-linecap="round"
    transform="rotate(${rotationDeg.toFixed(2)} ${cx} ${cy})" opacity=".78"/>`
}

function renderMouth(state: FaceRigState, anchor: { x: number; y: number }) {
  const mouth = state.mouth
  const cx = anchor.x
  const cy = anchor.y + mouth.offsetY
  const width = 58 * clamp(mouth.width, 0.25, 1.5)
  const half = width / 2
  const openness = clamp(mouth.openness, 0, 1)
  const roundness = clamp(mouth.roundness, 0, 1)
  const smile = clamp(mouth.smile, -1, 1)

  if (roundness > 0.65 && openness > 0.35) {
    const rx = mix(8, 16, roundness)
    const ry = mix(9, 21, openness)
    return `<ellipse cx="${cx}" cy="${cy + 2}" rx="${rx}" ry="${ry}" fill="#7b453f" stroke="#b96860" stroke-width="5"/>
      <ellipse cx="${cx}" cy="${cy + 8}" rx="${rx * 0.52}" ry="${ry * 0.28}" fill="#f29aa0" opacity=".9"/>`
  }

  const smileDepth = 6 + smile * 14
  if (openness < 0.16) {
    return `<path d="M ${cx - half} ${cy} Q ${cx} ${cy + smileDepth} ${cx + half} ${cy}"
      fill="none" stroke="#c77d73" stroke-width="6" stroke-linecap="round"/>`
  }

  const openDepth = 7 + openness * 18
  return `<path d="M ${cx - half} ${cy}
      Q ${cx} ${cy + smileDepth} ${cx + half} ${cy}
      Q ${cx} ${cy + openDepth + smileDepth * 0.35} ${cx - half} ${cy} Z"
      fill="#7b453f" stroke="#c77d73" stroke-width="5" stroke-linejoin="round"/>
    <path d="M ${cx - half * 0.52} ${cy + openDepth * 0.62}
      Q ${cx} ${cy + openDepth * 0.96} ${cx + half * 0.52} ${cy + openDepth * 0.62}"
      fill="#f29aa0" stroke="none"/>`
}

function renderBlush(
  anchor: { x: number; y: number },
  opacity: number,
  scale: number,
  side: 'left' | 'right'
) {
  const alpha = clamp(opacity, 0, 1)
  if (alpha <= 0.01) return ''
  const direction = side === 'left' ? -1 : 1
  const rotation = direction * 4
  const rx = 33 * scale
  const ry = 15.5 * scale

  return `<g transform="rotate(${rotation} ${anchor.x} ${anchor.y})" opacity="${alpha.toFixed(3)}">
    <ellipse cx="${anchor.x + direction * 2}" cy="${anchor.y + 1}" rx="${rx}" ry="${ry}"
      fill="url(#blush-glow)" filter="url(#blush-soft)"/>
    <ellipse cx="${anchor.x - direction * 4}" cy="${anchor.y - 1}" rx="${rx * 0.62}" ry="${ry * 0.62}"
      fill="url(#blush-core)" opacity=".5"/>
  </g>`
}

function renderCheekDots(
  anchor: { x: number; y: number },
  opacity: number,
  scale: number,
  side: 'left' | 'right'
) {
  const alpha = mix(0.52, 0.92, clamp(opacity, 0, 1))
  const direction = side === 'left' ? -1 : 1
  const base = 3.3 * mix(0.92, 1.08, clamp(scale - 0.8, 0, 0.4) / 0.4)
  const points = [
    { x: -17, y: -2, r: 0.78 },
    { x: -7, y: 7, r: 1 },
    { x: 5, y: -5, r: 0.72 },
    { x: 15, y: 4, r: 0.58 }
  ]

  return `<g fill="#d93333" opacity="${alpha.toFixed(3)}">
    ${points.map((point) => `<circle cx="${anchor.x + direction * point.x}" cy="${anchor.y + point.y}" r="${(base * point.r).toFixed(2)}"/>`).join('')}
  </g>`
}

function renderEffects(state: FaceRigState) {
  const hearts = clamp(state.effects.hearts, 0, 1)
  const sparkles = clamp(state.effects.sparkles, 0, 1)
  const tears = clamp(state.effects.tears, 0, 1)

  return `${hearts > 0.01 ? `<g opacity="${hearts.toFixed(3)}" fill="#d93333">
      <path d="${heartPath(391, 154, 0.42)}"/>
      <path d="${heartPath(125, 150, 0.28)}" opacity=".78"/>
    </g>` : ''}
    ${sparkles > 0.01 ? `<g opacity="${sparkles.toFixed(3)}" fill="#e2ad19">
      <path d="M 389 104 L 395 121 L 412 127 L 395 133 L 389 150 L 383 133 L 366 127 L 383 121 Z"/>
      <circle cx="424" cy="172" r="6"/>
    </g>` : ''}
    ${tears > 0.01 ? `<g opacity="${tears.toFixed(3)}" fill="#75bce8">
      <path d="M 184 286 C 174 303 177 317 188 321 C 199 317 201 303 184 286 Z"/>
      <path d="M 328 286 C 318 303 321 317 332 321 C 343 317 345 303 328 286 Z"/>
    </g>` : ''}`
}

/**
 * Experimental renderer for the modular rig branch.
 * It deliberately renders only the reusable head/face layer; hair remains in
 * the existing sprite reference until dedicated modular hair assets exist.
 */
export function renderFaceRigSvg(
  manifest: CharacterRigManifest,
  state: FaceRigState,
  label = `${manifest.label} modular face`
) {
  const { width, height } = manifest.viewBox
  const anchors = manifest.anchors
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="skin" cx="44%" cy="32%" r="72%">
      <stop offset="0" stop-color="#fff5ed"/>
      <stop offset="1" stop-color="#f2c9ad"/>
    </radialGradient>
    <radialGradient id="eye-left" cx="38%" cy="32%" r="70%">
      <stop offset="0" stop-color="#2c2927"/><stop offset="1" stop-color="#121111"/>
    </radialGradient>
    <radialGradient id="eye-right" cx="38%" cy="32%" r="70%">
      <stop offset="0" stop-color="#2c2927"/><stop offset="1" stop-color="#121111"/>
    </radialGradient>
    <radialGradient id="blush-glow" cx="50%" cy="48%" r="54%">
      <stop offset="0" stop-color="#f26f82" stop-opacity=".58"/>
      <stop offset="45%" stop-color="#f58d9c" stop-opacity=".32"/>
      <stop offset="78%" stop-color="#f6a2ad" stop-opacity=".12"/>
      <stop offset="100%" stop-color="#f6a2ad" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blush-core" cx="50%" cy="50%" r="58%">
      <stop offset="0" stop-color="#ed7181" stop-opacity=".42"/>
      <stop offset="100%" stop-color="#f3a1aa" stop-opacity="0"/>
    </radialGradient>
    <filter id="blush-soft" x="-30%" y="-60%" width="160%" height="220%">
      <feGaussianBlur stdDeviation="2.8"/>
    </filter>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#6f4936" flood-opacity=".18"/>
    </filter>
  </defs>
  <path d="M96 224 C96 130 163 82 256 82 C349 82 416 130 416 224 L416 302 C416 389 350 432 256 432 C162 432 96 389 96 302 Z"
    fill="url(#skin)" filter="url(#soft-shadow)"/>
  ${renderBlush(anchors.leftBlush, state.blush.opacity, state.blush.scale, 'left')}
  ${renderBlush(anchors.rightBlush, state.blush.opacity, state.blush.scale, 'right')}
  ${renderBrow(anchors.leftBrow, state.leftBrow)}
  ${renderBrow(anchors.rightBrow, state.rightBrow)}
  ${renderEye(state.leftEye, anchors.leftEye, 'eye-left')}
  ${renderEye(state.rightEye, anchors.rightEye, 'eye-right')}
  ${renderMouth(state, anchors.mouth)}
  ${renderCheekDots(anchors.leftBlush, state.blush.opacity, state.blush.scale, 'left')}
  ${renderCheekDots(anchors.rightBlush, state.blush.opacity, state.blush.scale, 'right')}
  ${renderEffects(state)}
</svg>`
}
