import { gifIndexe, indexe, nouvellePalette, recense } from '@/ui/anime'
import type { VideoExportFormat, VideoExportQuality } from '@/ui/video'
import { expressionSequenceDurationMs, type ExpressionSequence } from '../expression-sequence'
import {
  PLUSH_BOB_RASTER_SOURCE,
  modularHairDefinition,
  normalizeHairPlacement,
  type HairPlacement,
  type ModularHairId
} from './hair'
import {
  STELLA_GENERATED_ASSETS,
  STELLA_GENERATED_ASSET_SHEET,
  normalizeLayerPlacement,
  type LayerPlacement
} from './generated-assets'
import {
  accessoryDefinition,
  type AccessoryId,
  type AccessoryPlacement
} from './accessory'
import { rigFrameForSequence } from './sequence-renderer'
import type { FaceRigState } from './types'

export type RigSequenceExportFormat = 'gif' | VideoExportFormat
export type RigSequenceExportBackground = 'studio' | 'transparent'
export type RigCompositeLayer = 'base-head' | 'face-rig' | 'hair' | 'legacy-character' | 'accessory'

export type RigSequenceExportOptions = Readonly<{
  sequence: ExpressionSequence
  format: RigSequenceExportFormat
  size: 320 | 512 | 1024
  fps: 10 | 15 | 20 | 24 | 30
  quality: VideoExportQuality
  background: RigSequenceExportBackground
  hairId?: ModularHairId
  hairPlacement?: Partial<HairPlacement>
  accessoryId?: AccessoryId
  accessoryPlacement?: Partial<AccessoryPlacement>
  onProgress?: (progress: number) => void
}>

export function rigStateForExpressionSequence(sequence: ExpressionSequence, elapsedMs: number): FaceRigState {
  return rigFrameForSequence(sequence, elapsedMs, { hairId: 'none' }).state
}

/**
 * Canonical compositing order used by export. Generated characters always draw
 * base raster → parametric face → generated hair → generated accessory.
 */
export function rigCompositeLayerOrder(
  hairId: ModularHairId = 'generated-classic-bob',
  accessoryId: AccessoryId = 'none'
): readonly RigCompositeLayer[] {
  const hair = modularHairDefinition(hairId)
  const layers: RigCompositeLayer[] = []

  if (hair?.sourceKind === 'raster-shell') {
    layers.push('legacy-character')
  } else {
    layers.push('base-head', 'face-rig')
    if (hair?.sourceKind === 'generated-overlay') layers.push('hair')
  }

  if (accessoryDefinition(accessoryId)) layers.push('accessory')
  return layers
}

function studioBackdrop(context: CanvasRenderingContext2D, size: number) {
  const gradient = context.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#edf4f6')
  gradient.addColorStop(1, '#f5ece7')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
}

function loadSvgImage(svg: string) {
  return new Promise<{ image: HTMLImageElement; url: string }>((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => resolve({ image, url })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to rasterize modular rig SVG'))
    }
    image.src = url
  })
}

function loadRasterImage(source: string, errorMessage: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(errorMessage))
    image.src = source
  })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to inline modular character asset'))
    reader.readAsDataURL(blob)
  })
}

async function inlineAsset(url: string, errorMessage: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(errorMessage)
  return blobToDataUrl(await response.blob())
}

async function resolveSources(hairId: ModularHairId, accessoryId: AccessoryId) {
  const definition = modularHairDefinition(hairId)
  const legacyHair = definition?.sourceKind === 'raster-shell'
  const needsGeneratedSheet = !legacyHair || accessoryId !== 'none'
  const [hairSource, assetSheetSource] = await Promise.all([
    legacyHair
      ? inlineAsset(PLUSH_BOB_RASTER_SOURCE, 'Unable to load legacy Plush Bob source for export')
      : Promise.resolve(undefined),
    needsGeneratedSheet
      ? inlineAsset(STELLA_GENERATED_ASSET_SHEET, 'Unable to load generated character asset pack for export')
      : Promise.resolve(undefined)
  ])
  return { hairSource, assetSheetSource, legacyHair }
}

function drawAssetCell(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cell: number,
  size: number,
  placementInput: Partial<LayerPlacement> = {}
) {
  const placement = normalizeLayerPlacement(placementInput)
  const sourceSize = 512
  const sourceY = cell * sourceSize
  const unit = size / sourceSize

  context.save()
  context.translate(size / 2 + placement.offsetX * unit, size / 2 + placement.offsetY * unit)
  context.rotate((placement.rotation * Math.PI) / 180)
  context.scale(placement.scale, placement.scale)
  context.translate(-size / 2, -size / 2)
  context.drawImage(
    image,
    0,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size
  )
  context.restore()
}

async function drawSvgLayer(
  context: CanvasRenderingContext2D,
  svg: string,
  size: number
) {
  const { image, url } = await loadSvgImage(svg)
  try {
    context.drawImage(image, 0, 0, size, size)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function drawRigFrame(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  options: RigSequenceExportOptions,
  elapsedMs: number,
  resources: Readonly<{
    legacyHair: boolean
    hairSource?: string
    assetSheetImage?: HTMLImageElement
  }>
) {
  context.clearRect(0, 0, options.size, options.size)
  const opaqueVideo = options.format !== 'gif'
  if (options.background === 'studio' || opaqueVideo) studioBackdrop(context, options.size)

  const hairId = options.hairId ?? 'generated-classic-bob'
  const accessoryId = options.accessoryId ?? 'none'
  const hairDefinition = modularHairDefinition(hairId)
  const accessory = accessoryDefinition(accessoryId)
  const frame = rigFrameForSequence(options.sequence, elapsedMs, {
    hairId,
    hairPlacement: options.hairPlacement,
    hairSource: resources.hairSource,
    accessoryId: 'none'
  })

  for (const layer of rigCompositeLayerOrder(hairId, accessoryId)) {
    switch (layer) {
      case 'legacy-character':
        await drawSvgLayer(context, frame.svg, options.size)
        break
      case 'base-head':
        if (!resources.assetSheetImage) throw new Error('Generated character asset pack is unavailable')
        drawAssetCell(
          context,
          resources.assetSheetImage,
          STELLA_GENERATED_ASSETS['base-head'].cell,
          options.size
        )
        break
      case 'face-rig':
        await drawSvgLayer(context, frame.faceSvg, options.size)
        break
      case 'hair':
        if (!resources.assetSheetImage) throw new Error('Generated character asset pack is unavailable')
        if (hairDefinition?.sourceKind !== 'generated-overlay' || !hairDefinition.generatedAsset) break
        drawAssetCell(
          context,
          resources.assetSheetImage,
          STELLA_GENERATED_ASSETS[hairDefinition.generatedAsset].cell,
          options.size,
          normalizeHairPlacement(options.hairPlacement)
        )
        break
      case 'accessory':
        if (!resources.assetSheetImage || !accessory?.generatedAsset) {
          throw new Error('Generated accessory asset is unavailable')
        }
        drawAssetCell(
          context,
          resources.assetSheetImage,
          STELLA_GENERATED_ASSETS[accessory.generatedAsset].cell,
          options.size,
          options.accessoryPlacement
        )
        break
    }
  }

  return canvas
}

export async function createRigSequenceExport(options: RigSequenceExportOptions): Promise<Blob> {
  const totalDurationMs = expressionSequenceDurationMs(options.sequence)
  if (totalDurationMs <= 0) throw new Error('The rig sequence has no duration')

  const hairId = options.hairId ?? 'generated-classic-bob'
  const accessoryId = options.accessoryId ?? 'none'
  const { hairSource, assetSheetSource, legacyHair } = await resolveSources(hairId, accessoryId)
  const assetSheetImage = assetSheetSource
    ? await loadRasterImage(assetSheetSource, 'Unable to decode generated character asset pack')
    : undefined

  const frameCount = Math.max(2, Math.round((totalDurationMs / 1000) * options.fps))
  const canvas = document.createElement('canvas')
  canvas.width = options.size
  canvas.height = options.size
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('Canvas is unavailable')
  const elapsedForFrame = (index: number) => (index / frameCount) * totalDurationMs
  const resources = { legacyHair, hairSource, assetSheetImage }

  if (options.format !== 'gif') {
    const { versVideo } = await import('@/ui/video')
    return versVideo(
      canvas,
      frameCount,
      options.fps,
      async (index) => {
        await drawRigFrame(canvas, context, options, elapsedForFrame(index), resources)
      },
      options.format,
      options.quality,
      (done, total) => options.onProgress?.(done / total)
    )
  }

  const frames: Uint8ClampedArray[] = []
  for (let index = 0; index < frameCount; index += 1) {
    await drawRigFrame(canvas, context, options, elapsedForFrame(index), resources)
    frames.push(context.getImageData(0, 0, options.size, options.size).data)
    options.onProgress?.((index + 1) / (frameCount * 3))
    if (index % 3 === 2) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  const palette = nouvellePalette()
  for (let index = 0; index < frames.length; index += 1) {
    recense(palette, frames[index]!)
    options.onProgress?.((frameCount + index + 1) / (frameCount * 3))
    if (index % 4 === 3) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  const indexed: Uint8Array[] = []
  for (let index = 0; index < frames.length; index += 1) {
    indexed.push(indexe(palette, frames[index]!))
    options.onProgress?.((frameCount * 2 + index + 1) / (frameCount * 3))
    if (index % 4 === 3) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  const bytes = gifIndexe(palette, indexed, options.size, options.size, Math.round(1000 / options.fps))
  options.onProgress?.(1)
  return new Blob([bytes], { type: 'image/gif' })
}
