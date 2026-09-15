import {
  renderGeneratedAssetCell,
  type GeneratedAssetId,
  type LayerPlacement
} from './generated-assets'

export type ModularHairId =
  | 'none'
  | 'plush-bob'
  | 'generated-star-buns'
  | 'generated-orange-bob'
  | 'generated-cat-bob'
  | 'generated-classic-bob'
export type HairLayerPart = 'back' | 'front'
export type HairPlacement = LayerPlacement

export type ModularHairDefinition = Readonly<{
  id: Exclude<ModularHairId, 'none'>
  label: string
  description: string
  sourceKind: 'raster-shell' | 'generated-overlay'
  sourceAsset: string
  generatedAsset?: GeneratedAssetId
  defaultPlacement: HairPlacement
}>

export const PLUSH_BOB_RASTER_SOURCE = '/assets/stella/stella-sprite-00.webp'
export const PLUSH_BOB_FACE_OPENING_ID = 'plush-bob-face-opening-fitted'

const PLUSH_BOB_FACE_OPENING_PATH = `M 132 220
  C 154 206 183 199 214 199
  C 229 199 243 202 256 206
  C 269 202 283 199 298 199
  C 329 199 358 206 380 220
  C 387 247 390 285 388 344
  C 385 401 347 433 256 438
  C 165 433 127 401 124 344
  C 122 285 125 247 132 220 Z`

export const DEFAULT_HAIR_PLACEMENT: HairPlacement = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0
}

export const STELLA_MODULAR_HAIRS: readonly ModularHairDefinition[] = [
  {
    id: 'generated-classic-bob',
    label: 'Classic Plush Bob',
    description: 'Generated transparent black plush bob based on the reference character.',
    sourceKind: 'generated-overlay',
    sourceAsset: '/assets/stella/generated/asset-sheet.webp',
    generatedAsset: 'classic-bob',
    defaultPlacement: DEFAULT_HAIR_PLACEMENT
  },
  {
    id: 'generated-star-buns',
    label: 'Star Buns',
    description: 'Generated twin-bun hairstyle with the white star clip preserved as part of the hair layer.',
    sourceKind: 'generated-overlay',
    sourceAsset: '/assets/stella/generated/asset-sheet.webp',
    generatedAsset: 'star-buns',
    defaultPlacement: DEFAULT_HAIR_PLACEMENT
  },
  {
    id: 'generated-orange-bob',
    label: 'Orange Plush Bob',
    description: 'Generated orange plush bob with the reference top and fringe details.',
    sourceKind: 'generated-overlay',
    sourceAsset: '/assets/stella/generated/asset-sheet.webp',
    generatedAsset: 'orange-bob',
    defaultPlacement: DEFAULT_HAIR_PLACEMENT
  },
  {
    id: 'generated-cat-bob',
    label: 'Compact Black Bob',
    description: 'Generated compact black bob extracted from the bandana reference hairstyle.',
    sourceKind: 'generated-overlay',
    sourceAsset: '/assets/stella/generated/asset-sheet.webp',
    generatedAsset: 'cat-bob',
    defaultPlacement: DEFAULT_HAIR_PLACEMENT
  },
  {
    id: 'plush-bob',
    label: 'Legacy source-mask Plush Bob',
    description: 'Earlier experimental runtime mask extracted from Stella original raster art.',
    sourceKind: 'raster-shell',
    sourceAsset: PLUSH_BOB_RASTER_SOURCE,
    defaultPlacement: DEFAULT_HAIR_PLACEMENT
  }
] as const

export function modularHairDefinition(id: ModularHairId) {
  if (id === 'none') return null
  return STELLA_MODULAR_HAIRS.find((hair) => hair.id === id) ?? STELLA_MODULAR_HAIRS[0]!
}

export function modularHairSource(id: ModularHairId) {
  return modularHairDefinition(id)?.sourceAsset ?? null
}

export function normalizeHairPlacement(
  placement: Partial<HairPlacement> = {}
): HairPlacement {
  const scale = Number.isFinite(placement.scale) ? placement.scale! : 1
  return {
    offsetX: Math.max(-56, Math.min(56, Number.isFinite(placement.offsetX) ? placement.offsetX! : 0)),
    offsetY: Math.max(-56, Math.min(56, Number.isFinite(placement.offsetY) ? placement.offsetY! : 0)),
    scale: Math.max(0.72, Math.min(1.28, scale)),
    rotation: Math.max(-12, Math.min(12, Number.isFinite(placement.rotation) ? placement.rotation! : 0))
  }
}

function transformFor(placementInput: Partial<HairPlacement>) {
  const placement = normalizeHairPlacement(placementInput)
  return `translate(${placement.offsetX} ${placement.offsetY}) translate(256 256) rotate(${placement.rotation}) scale(${placement.scale}) translate(-256 -256)`
}

export function renderStellaHairDefs(placementInput: Partial<HairPlacement> = {}) {
  const fittedTransform = transformFor(placementInput)
  return `<defs data-hair-defs="plush-bob-raster-shell">
    <clipPath id="${PLUSH_BOB_FACE_OPENING_ID}" clipPathUnits="userSpaceOnUse">
      <path d="${PLUSH_BOB_FACE_OPENING_PATH}" transform="${fittedTransform}"/>
    </clipPath>
    <mask id="plush-bob-back-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512" style="mask-type:luminance">
      <rect x="0" y="0" width="512" height="512" fill="#fff"/>
      <path d="${PLUSH_BOB_FACE_OPENING_PATH}" fill="#000"/>
    </mask>
    <clipPath id="plush-bob-fringe-window" clipPathUnits="userSpaceOnUse">
      <path d="M 132 198 H 380 V 306 C 356 306 334 303 314 300 C 292 297 275 296 256 300 C 237 296 220 297 198 300 C 178 303 156 306 132 306 Z"/>
    </clipPath>
  </defs>`
}

export function renderStellaHairLayer(
  id: ModularHairId,
  part: HairLayerPart,
  placementInput: Partial<HairPlacement> = {},
  sourceHref = PLUSH_BOB_RASTER_SOURCE
) {
  if (id !== 'plush-bob') return ''
  const transform = transformFor(placementInput)
  if (part === 'back') {
    return `<g data-hair-id="${id}" data-hair-layer="back" data-hair-source="raster" transform="${transform}">
      <image href="${sourceHref}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" mask="url(#plush-bob-back-mask)"/>
    </g>`
  }
  return `<g data-hair-id="${id}" data-hair-layer="front" data-hair-source="raster" transform="${transform}">
    <image href="${sourceHref}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" clip-path="url(#plush-bob-fringe-window)"/>
  </g>`
}

export function renderGeneratedHairLayer(
  id: ModularHairId,
  placementInput: Partial<HairPlacement> = {},
  assetSheetSource?: string
) {
  const definition = modularHairDefinition(id)
  if (!definition || definition.sourceKind !== 'generated-overlay' || !definition.generatedAsset) return ''
  return renderGeneratedAssetCell(
    definition.generatedAsset,
    placementInput,
    assetSheetSource,
    `data-character-layer="hair-overlay" data-hair-id="${id}" data-hair-source="generated"`
  )
}
