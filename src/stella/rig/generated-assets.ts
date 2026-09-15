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

/** Render one 512×512 cell from the vertically stacked generated asset sheet. */
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
  return `<g data-generated-asset="${id}" data-generated-kind="${asset.kind}" transform="${transform}" ${attributes}>
    <svg x="0" y="0" width="512" height="512" viewBox="0 ${y} 512 512" overflow="hidden" preserveAspectRatio="xMidYMid meet">
      <image href="${sourceHref}" x="0" y="0" width="512" height="${sheetHeight}" preserveAspectRatio="none"/>
    </svg>
  </g>`
}
