export const STELLA_GENERATED_ASSET_SHEET = '/assets/stella/generated/asset-sheet.webp'
export const GENERATED_ASSET_CELL_SIZE = 512
export const GENERATED_ASSET_CELL_COUNT = 6

export type GeneratedAssetId =
  | 'base-head'
  | 'star-buns'
  | 'orange-bob'
  | 'cat-bob'
  | 'classic-bob'
  | 'cat-bandana'

export type LayerPlacement = Readonly<{
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
}>

export type GeneratedAssetLayerStyle = Readonly<{
  backgroundImage: string
  backgroundPosition: string
  backgroundRepeat: 'no-repeat'
  backgroundSize: string
  transform: string
  transformOrigin: '50% 50%'
}>

export const DEFAULT_LAYER_PLACEMENT: LayerPlacement = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0
}

export const STELLA_GENERATED_ASSETS: Readonly<Record<GeneratedAssetId, Readonly<{
  id: GeneratedAssetId
  label: string
  kind: 'base' | 'hair' | 'accessory'
  cell: number
}>>> = {
  'base-head': { id: 'base-head', label: 'Generated base head', kind: 'base', cell: 0 },
  'star-buns': { id: 'star-buns', label: 'Star Buns', kind: 'hair', cell: 1 },
  'orange-bob': { id: 'orange-bob', label: 'Orange Plush Bob', kind: 'hair', cell: 2 },
  'cat-bob': { id: 'cat-bob', label: 'Compact Black Bob', kind: 'hair', cell: 3 },
  'classic-bob': { id: 'classic-bob', label: 'Classic Plush Bob', kind: 'hair', cell: 4 },
  'cat-bandana': { id: 'cat-bandana', label: 'White Cat Bandana', kind: 'accessory', cell: 5 }
}

export function normalizeLayerPlacement(
  placement: Partial<LayerPlacement> = {},
  limits: { offset?: number; minScale?: number; maxScale?: number; rotation?: number } = {}
): LayerPlacement {
  const offsetLimit = limits.offset ?? 56
  const minScale = limits.minScale ?? 0.72
  const maxScale = limits.maxScale ?? 1.28
  const rotationLimit = limits.rotation ?? 12
  const scale = Number.isFinite(placement.scale) ? placement.scale! : 1
  return {
    offsetX: Math.max(-offsetLimit, Math.min(offsetLimit, Number.isFinite(placement.offsetX) ? placement.offsetX! : 0)),
    offsetY: Math.max(-offsetLimit, Math.min(offsetLimit, Number.isFinite(placement.offsetY) ? placement.offsetY! : 0)),
    scale: Math.max(minScale, Math.min(maxScale, scale)),
    rotation: Math.max(-rotationLimit, Math.min(rotationLimit, Number.isFinite(placement.rotation) ? placement.rotation! : 0))
  }
}

export function layerTransform(placementInput: Partial<LayerPlacement> = {}) {
  const placement = normalizeLayerPlacement(placementInput)
  return `translate(${placement.offsetX} ${placement.offsetY}) translate(256 256) rotate(${placement.rotation}) scale(${placement.scale}) translate(-256 -256)`
}

function percent(value: number) {
  const rounded = Math.round(value * 1_000_000) / 1_000_000
  return `${Object.is(rounded, -0) ? 0 : rounded}%`
}

/**
 * CSS equivalent of the canvas placement transform. Offsets are authored in
 * the rig's 512×512 coordinate space and converted to percentages so preview
 * placement stays identical as the responsive stage changes size.
 */
export function layerCssTransform(placementInput: Partial<LayerPlacement> = {}) {
  const placement = normalizeLayerPlacement(placementInput)
  const offsetX = percent((placement.offsetX / GENERATED_ASSET_CELL_SIZE) * 100)
  const offsetY = percent((placement.offsetY / GENERATED_ASSET_CELL_SIZE) * 100)
  return `translate(${offsetX}, ${offsetY}) rotate(${placement.rotation}deg) scale(${placement.scale})`
}

/**
 * Style one 512×512 cell from the vertical sheet as a normal browser layer.
 * The background-position percentages account for CSS background positioning's
 * available-space behavior: 0/20/40/60/80/100% select cells 0–5 exactly.
 */
export function generatedAssetLayerStyle(
  id: GeneratedAssetId,
  placementInput: Partial<LayerPlacement> = {},
  sourceHref = STELLA_GENERATED_ASSET_SHEET
): GeneratedAssetLayerStyle {
  const asset = STELLA_GENERATED_ASSETS[id]
  const cellPosition = GENERATED_ASSET_CELL_COUNT <= 1
    ? 0
    : (asset.cell / (GENERATED_ASSET_CELL_COUNT - 1)) * 100

  return {
    backgroundImage: `url("${sourceHref}")`,
    backgroundPosition: `center ${percent(cellPosition)}`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `100% ${GENERATED_ASSET_CELL_COUNT * 100}%`,
    transform: layerCssTransform(placementInput),
    transformOrigin: '50% 50%'
  }
}

/**
 * SVG compatibility renderer retained for legacy/internal experiments only.
 * Generated character preview/export use real DOM and canvas raster layers.
 */
export function renderGeneratedAssetCell(
  id: GeneratedAssetId,
  placementInput: Partial<LayerPlacement> = {},
  sourceHref = STELLA_GENERATED_ASSET_SHEET,
  attributes = ''
) {
  const asset = STELLA_GENERATED_ASSETS[id]
  const transform = layerTransform(placementInput)
  const y = asset.cell * GENERATED_ASSET_CELL_SIZE
  const sheetHeight = GENERATED_ASSET_CELL_SIZE * GENERATED_ASSET_CELL_COUNT
  const clipId = `generated-asset-clip-${id}`

  return `<g data-generated-asset="${id}" data-generated-kind="${asset.kind}" transform="${transform}" ${attributes}>
    <defs>
      <clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">
        <rect x="0" y="0" width="512" height="512"/>
      </clipPath>
    </defs>
    <g clip-path="url(#${clipId})">
      <image href="${sourceHref}" x="0" y="${-y}" width="512" height="${sheetHeight}" preserveAspectRatio="none"/>
    </g>
  </g>`
}
