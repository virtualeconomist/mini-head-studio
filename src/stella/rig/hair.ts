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
 * Definitions used to extract the dark Plush Bob pixels from Stella's original
 * transparent WebP. This keeps the actual fuzzy texture and silhouette instead
 * of approximating the hairstyle with flat vector paths.
 */
export function renderStellaHairDefs(sourceHref = PLUSH_BOB_RASTER_SOURCE) {
  return `<defs data-hair-defs="plush-bob-raster-shell">
    <filter id="plush-bob-hair-alpha" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" result="darkness" type="matrix" values="
        0 0 0 0 1
        0 0 0 0 1
        0 0 0 0 1
        -0.34 -0.33 -0.33 0 1"/>
      <feComposite in="darkness" in2="SourceAlpha" operator="in" result="source-darkness"/>
      <feComponentTransfer in="source-darkness">
        <feFuncA type="table" tableValues="0 0 0.02 0.18 0.72 1 1"/>
      </feComponentTransfer>
    </filter>

    <mask id="plush-bob-all-hair-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512" mask-type="luminance">
      <image href="${sourceHref}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" filter="url(#plush-bob-hair-alpha)"/>
    </mask>

    <mask id="plush-bob-back-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512" mask-type="luminance">
      <image href="${sourceHref}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" filter="url(#plush-bob-hair-alpha)"/>
      <path d="M 139 273
        C 162 242 202 225 256 225
        C 310 225 350 242 373 273
        C 386 294 391 326 388 363
        C 383 409 347 438 256 442
        C 165 438 129 409 124 363
        C 121 326 126 294 139 273 Z"
        fill="#000"/>
    </mask>

    <clipPath id="plush-bob-fringe-window" clipPathUnits="userSpaceOnUse">
      <path d="M 88 72 H 424 V 292
        C 397 292 377 289 356 291
        C 332 294 310 301 289 306
        C 272 310 258 309 244 306
        C 224 302 205 296 184 293
        C 160 289 133 291 88 296 Z"/>
    </clipPath>
  </defs>`
}

/**
 * Returns one independent raster hair layer. The layer uses Stella's original
 * Plush Bob source pixels but has no dependency on expression state, removing
 * the old hair × expression sprite multiplication.
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
      preserveAspectRatio="xMidYMid meet"
      mask="url(#plush-bob-all-hair-mask)"
      clip-path="url(#plush-bob-fringe-window)"/>
  </g>`
}
