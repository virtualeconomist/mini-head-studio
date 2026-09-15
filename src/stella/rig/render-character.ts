import { renderFaceRigSvg } from './render-svg'
import {
  PLUSH_BOB_FACE_OPENING_ID,
  PLUSH_BOB_RASTER_SOURCE,
  modularHairDefinition,
  renderGeneratedHairLayer,
  renderStellaHairDefs,
  renderStellaHairLayer,
  type HairPlacement,
  type ModularHairId
} from './hair'
import {
  STELLA_GENERATED_ASSET_SHEET,
  renderGeneratedAssetCell
} from './generated-assets'
import {
  renderStellaAccessoryLayer,
  type AccessoryId,
  type AccessoryPlacement
} from './accessory'
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

export function renderStellaCharacterSvg(
  state: FaceRigState,
  options: StellaCharacterRenderOptions = {}
) {
  const hairId = options.hairId ?? 'generated-classic-bob'
  const hairPlacement = options.hairPlacement ?? {}
  const accessoryId = options.accessoryId ?? 'none'
  const accessoryPlacement = options.accessoryPlacement ?? {}
  const hairDefinition = modularHairDefinition(hairId)
  const legacyHair = hairDefinition?.sourceKind === 'raster-shell'
  const legacyHairSource = options.hairSource ?? PLUSH_BOB_RASTER_SOURCE
  const assetSheetSource = options.assetSheetSource ?? STELLA_GENERATED_ASSET_SHEET
  const label = options.label ?? `${STELLA_RIG_MANIFEST.label} modular character`
  const faceSvg = renderFaceRigSvg(
    STELLA_RIG_MANIFEST,
    state,
    `${STELLA_RIG_MANIFEST.label} modular face`
  )
  const faceBody = innerSvgMarkup(faceSvg)
  const generatedFaceBody = faceFeaturesOnly(faceBody)
  const { width, height } = STELLA_RIG_MANIFEST.viewBox

  if (legacyHair) {
    const faceClip = ` clip-path="url(#${PLUSH_BOB_FACE_OPENING_ID})"`
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" data-character-shell="stella" data-hair="${hairId}" data-accessory="${accessoryId}">
  ${renderStellaHairDefs(hairPlacement)}
  ${renderStellaHairLayer(hairId, 'back', hairPlacement, legacyHairSource)}
  <g data-character-layer="face-rig"${faceClip}>${faceBody}</g>
  ${renderStellaHairLayer(hairId, 'front', hairPlacement, legacyHairSource)}
  ${renderStellaAccessoryLayer(accessoryId, accessoryPlacement, assetSheetSource)}
</svg>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" data-character-shell="stella" data-hair="${hairId}" data-accessory="${accessoryId}">
  ${renderGeneratedAssetCell('base-head', {}, assetSheetSource, 'data-character-layer="base-head"')}
  <g data-character-layer="face-rig">${generatedFaceBody}</g>
  ${renderGeneratedHairLayer(hairId, hairPlacement, assetSheetSource)}
  ${renderStellaAccessoryLayer(accessoryId, accessoryPlacement, assetSheetSource)}
</svg>`
}
