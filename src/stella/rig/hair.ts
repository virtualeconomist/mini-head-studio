export type ModularHairId = 'none' | 'plush-bob'
export type HairLayerPart = 'back' | 'front'

export type HairPlacement = Readonly<{
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
}>

export type ModularHairDefinition = Readonly<{
  id: Exclude<ModularHairId, 'none'>
  label: string
  description: string
  sourceKind: 'raster-shell'
  sourceAsset: string
  defaultPlacement: HairPlacement
}>

export const PLUSH_BOB_RASTER_SOURCE = '/assets/stella/stella-sprite-00.webp'
export const PLUSH_BOB_FACE_OPENING_ID = 'plush-bob-face-opening'

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
    id: 'plush-bob',
    label: 'Plush Bob',
    description: 'Source-faithful raster shell extracted from Stella original art. Back hair and fringe remain independent from face expression state.',
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
    offsetX: Number.isFinite(placement.offsetX) ? placement.offsetX! : 0,
    offsetY: Number.isFinite(placement.offsetY) ? placement.offsetY! : 0,
    scale: Math.max(0.82, Math.min(1.18, scale)),
    rotation: Math.max(-8, Math.min(8, Number.isFinite(placement.rotation) ? placement.rotation! : 0))
  }
}

function transformFor(placement: HairPlacement) {
  const { offsetX, offsetY, scale, rotation } = placement
  return `translate(${offsetX} ${offsetY}) translate(256 256) rotate(${rotation}) scale(${scale}) translate(-256 -256)`
}

/**
 * The original Stella WebP already contains the exact fuzzy silhouette and
 * texture we want. Instead of redrawing it, this shell masks out the original
 * face opening and later restores only the source fringe in front of the rig.
 */
export function renderStellaHairDefs() {
  return `<defs data-hair-defs="plush-bob-raster-shell">
    <clipPath id="${PLUSH_BOB_FACE_OPENING_ID}" clipPathUnits="userSpaceOnUse">
      <path d="${PLUSH_BOB_FACE_OPENING_PATH}"/>
    </clipPath>

    <mask id="plush-bob-back-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512" style="mask-type:luminance">
      <rect x="0" y="0" width="512" height="512" fill="#fff"/>
      <path d="${PLUSH_BOB_FACE_OPENING_PATH}" fill="#000"/>
    </mask>

    <clipPath id="plush-bob-fringe-window" clipPathUnits="userSpaceOnUse">
      <path d="M 132 198 H 380 V 306
        C 356 306 334 303 314 300
        C 292 297 275 296 256 300
        C 237 296 220 297 198 300
        C 178 303 156 306 132 306 Z"/>
    </clipPath>
  </defs>`
}

/**
 * Returns one independent source-raster hair layer. It intentionally receives
 * no expression state, so the same original Plush Bob pixels surround every
 * parametric face state.
 */
export function renderStellaHairLayer(
  id: ModularHairId,
  part: HairLayerPart,
  placementInput: Partial<HairPlacement> = {},
  sourceHref = PLUSH_BOB_RASTER_SOURCE
) {
  if (id === 'none') return ''
  const placement = normalizeHairPlacement(placementInput)
  const transform = transformFor(placement)

  if (part === 'back') {
    return `<g data-hair-id="${id}" data-hair-layer="back" data-hair-source="raster" transform="${transform}">
      <image href="${sourceHref}" x="0" y="0" width="512" height="512"
        preserveAspectRatio="xMidYMid meet" mask="url(#plush-bob-back-mask)"/>
    </g>`
  }

  return `<g data-hair-id="${id}" data-hair-layer="front" data-hair-source="raster" transform="${transform}">
    <image href="${sourceHref}" x="0" y="0" width="512" height="512"
      preserveAspectRatio="xMidYMid meet" clip-path="url(#plush-bob-fringe-window)"/>
  </g>`
}
