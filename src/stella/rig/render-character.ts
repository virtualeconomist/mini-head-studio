import { renderFaceRigSvg } from './render-svg'
import {
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
 * First Stella character shell compositor.
 *
 * Layer order is intentionally explicit:
 *   1. independent back hair
 *   2. reusable parametric face/head rig
 *   3. independent front fringe/hair
 *
 * The hair renderer never receives expression state. This is the architectural
 * boundary that removes the old hair × expression sprite multiplication.
 */
export function renderStellaCharacterSvg(
  state: FaceRigState,
  options: StellaCharacterRenderOptions = {}
) {
  const hairId = options.hairId ?? 'plush-bob'
  const hairPlacement = options.hairPlacement ?? {}
  const label = options.label ?? `${STELLA_RIG_MANIFEST.label} modular character`
  const faceSvg = renderFaceRigSvg(
    STELLA_RIG_MANIFEST,
    state,
    `${STELLA_RIG_MANIFEST.label} modular face`
  )
  const faceBody = innerSvgMarkup(faceSvg)
  const { width, height } = STELLA_RIG_MANIFEST.viewBox

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" data-character-shell="stella" data-hair="${hairId}">
  ${hairId === 'none' ? '' : renderStellaHairDefs()}
  ${renderStellaHairLayer(hairId, 'back', hairPlacement)}
  <g data-character-layer="face-rig">
    ${faceBody}
  </g>
  ${renderStellaHairLayer(hairId, 'front', hairPlacement)}
</svg>`
}
