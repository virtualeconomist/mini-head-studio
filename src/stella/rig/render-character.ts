import { renderFaceRigSvg } from './render-svg'
import {
  PLUSH_BOB_FACE_OPENING_ID,
  PLUSH_BOB_RASTER_SOURCE,
  modularHairDefinition,
  renderStellaHairDefs,
  renderStellaHairLayer,
  type HairPlacement,
  type ModularHairId
} from './hair'
import type { AccessoryId, AccessoryPlacement } from './accessory'
import { STELLA_RIG_MANIFEST } from './stella-manifest'
import type { FaceRigState } from './types'

export type StellaCharacterRenderOptions = Readonly<{
  hairId?: ModularHairId
  hairPlacement?: Partial<HairPlacement>
  hairSource?: string
  accessoryId?: AccessoryId
  accessoryPlacement?: Partial<AccessoryPlacement>
  assetSheetSource?: string
  label?: string
}>

function innerSvgMarkup(svg: string) {
  const open = svg.indexOf('<svg')
  const bodyStart = open >= 0 ? svg.indexOf('>', open) + 1 : 0
  const close = svg.lastIndexOf('</svg>')
  if (bodyStart <= 0 || close <= bodyStart) return svg
  return svg.slice(bodyStart, close)
}

/** Remove the procedural skin/head path while keeping all face features and defs. */
function faceFeaturesOnly(markup: string) {
  return markup.replace(
    /\s*<path d="M96 224[\s\S]*?filter="url\(#soft-shadow\)"\/>/,
    ''
  )
}

/**
 * Standalone parametric face-feature SVG used by the real layered preview/export
 * compositor. It deliberately contains no raster assets and no procedural head
 * fill, so the base head, hair, and accessories can be normal image layers.
 */
export function renderStellaFaceFeaturesSvg(
  state: FaceRigState,
  label = `${STELLA_RIG_MANIFEST.label} modular face features`
) {
  const source = renderFaceRigSvg(STELLA_RIG_MANIFEST, state, label)
  const body = faceFeaturesOnly(innerSvgMarkup(source))
  const { width, height } = STELLA_RIG_MANIFEST.viewBox
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" data-character-layer="face-rig-features">
  ${body}
</svg>`
}

/**
 * Compatibility SVG renderer. It owns the legacy source-mask Plush Bob path and
 * face-only SVG experiments. Generated head/hair/accessory assets intentionally
 * do not enter this SVG; those are composed by DOM layers in preview and canvas
 * drawImage calls during export.
 */
export function renderStellaCharacterSvg(
  state: FaceRigState,
  options: StellaCharacterRenderOptions = {}
) {
  const hairId = options.hairId ?? 'generated-classic-bob'
  const hairPlacement = options.hairPlacement ?? {}
  const hairDefinition = modularHairDefinition(hairId)
  const legacyHair = hairDefinition?.sourceKind === 'raster-shell'
  const legacyHairSource = options.hairSource ?? PLUSH_BOB_RASTER_SOURCE
  const label = options.label ?? `${STELLA_RIG_MANIFEST.label} modular character`

  if (!legacyHair) {
    if (hairId === 'none') {
      const faceSvg = renderFaceRigSvg(STELLA_RIG_MANIFEST, state, label)
      const faceBody = innerSvgMarkup(faceSvg)
      const { width, height } = STELLA_RIG_MANIFEST.viewBox
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" data-character-shell="stella" data-hair="none">
  <g data-character-layer="face-rig">${faceBody}</g>
</svg>`
    }
    return renderStellaFaceFeaturesSvg(state, label)
  }

  const faceSvg = renderFaceRigSvg(
    STELLA_RIG_MANIFEST,
    state,
    `${STELLA_RIG_MANIFEST.label} modular face`
  )
  const faceBody = innerSvgMarkup(faceSvg)
  const { width, height } = STELLA_RIG_MANIFEST.viewBox
  const faceClip = ` clip-path="url(#${PLUSH_BOB_FACE_OPENING_ID})"`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" data-character-shell="stella" data-hair="${hairId}">
  ${renderStellaHairDefs(hairPlacement)}
  ${renderStellaHairLayer(hairId, 'back', hairPlacement, legacyHairSource)}
  <g data-character-layer="face-rig"${faceClip}>${faceBody}</g>
  ${renderStellaHairLayer(hairId, 'front', hairPlacement, legacyHairSource)}
</svg>`
}
