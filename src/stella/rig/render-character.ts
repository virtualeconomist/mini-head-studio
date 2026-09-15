import { renderFaceRigSvg } from './render-svg'
import {
  PLUSH_BOB_FACE_OPENING_ID,
  PLUSH_BOB_RASTER_SOURCE,
  renderStellaHairDefs,
  renderStellaHairLayer,
  type HairPlacement,
  type ModularHairId
} from './hair'
import { STELLA_RIG_MANIFEST } from './stella-manifest'
import type { FaceRigState } from './types'

export type StellaCharacterRenderOptions = Readonly<{
  hairId?: ModularHairId
  hairPlacement?: Partial<HairPlacement>
  hairSource?: string
  label?: string
}>

function innerSvgMarkup(svg: string) {
  const open = svg.indexOf('<svg')
  const bodyStart = open >= 0 ? svg.indexOf('>', open) + 1 : 0
  const close = svg.lastIndexOf('</svg>')
  if (bodyStart <= 0 || close <= bodyStart) return svg
  return svg.slice(bodyStart, close)
}

/**
 * Stella character shell compositor.
 *
 * Layer order is intentionally explicit:
 *   1. source-faithful raster back hair
 *   2. reusable parametric face/head rig clipped to the fitted hair opening
 *   3. source-faithful raster fringe
 *
 * The hair renderer never receives expression state. The same source artwork
 * surrounds every rig state without hair × expression sprite variants.
 */
export function renderStellaCharacterSvg(
  state: FaceRigState,
  options: StellaCharacterRenderOptions = {}
) {
  const hairId = options.hairId ?? 'plush-bob'
  const hairPlacement = options.hairPlacement ?? {}
  const hairSource = options.hairSource ?? PLUSH_BOB_RASTER_SOURCE
  const label = options.label ?? `${STELLA_RIG_MANIFEST.label} modular character`
  const faceSvg = renderFaceRigSvg(
    STELLA_RIG_MANIFEST,
    state,
    `${STELLA_RIG_MANIFEST.label} modular face`
  )
  const faceBody = innerSvgMarkup(faceSvg)
  const { width, height } = STELLA_RIG_MANIFEST.viewBox
  const faceClip = hairId === 'none' ? '' : ` clip-path="url(#${PLUSH_BOB_FACE_OPENING_ID})"`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" data-character-shell="stella" data-hair="${hairId}">
  ${hairId === 'none' ? '' : renderStellaHairDefs(hairPlacement)}
  ${renderStellaHairLayer(hairId, 'back', hairPlacement, hairSource)}
  <g data-character-layer="face-rig"${faceClip}>
    ${faceBody}
  </g>
  ${renderStellaHairLayer(hairId, 'front', hairPlacement, hairSource)}
</svg>`
}
