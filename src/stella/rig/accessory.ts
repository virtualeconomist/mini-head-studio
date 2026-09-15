import {
  DEFAULT_LAYER_PLACEMENT,
  renderGeneratedAssetCell,
  type LayerPlacement
} from './generated-assets'

export type AccessoryId = 'none' | 'cat-bandana'
export type AccessoryPlacement = LayerPlacement

export type AccessoryDefinition = Readonly<{
  id: Exclude<AccessoryId, 'none'>
  label: string
  description: string
  generatedAsset: 'cat-bandana'
  defaultPlacement: AccessoryPlacement
}>

export const DEFAULT_ACCESSORY_PLACEMENT: AccessoryPlacement = DEFAULT_LAYER_PLACEMENT

export const STELLA_ACCESSORIES: readonly AccessoryDefinition[] = [
  {
    id: 'cat-bandana',
    label: 'White Cat Bandana',
    description: 'Generated transparent white cat-ear bandana / hood overlay.',
    generatedAsset: 'cat-bandana',
    defaultPlacement: DEFAULT_ACCESSORY_PLACEMENT
  }
] as const

export function accessoryDefinition(id: AccessoryId) {
  if (id === 'none') return null
  return STELLA_ACCESSORIES.find((item) => item.id === id) ?? STELLA_ACCESSORIES[0]!
}

export function renderStellaAccessoryLayer(
  id: AccessoryId,
  placement: Partial<AccessoryPlacement> = {},
  assetSheetSource?: string
) {
  const definition = accessoryDefinition(id)
  if (!definition) return ''
  return renderGeneratedAssetCell(
    definition.generatedAsset,
    placement,
    assetSheetSource,
    `data-character-layer="accessory" data-accessory-id="${id}"`
  )
}
