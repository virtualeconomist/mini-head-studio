export type BackdropId =
  | 'vanilla'
  | 'blush'
  | 'studio'
  | 'transparent'
  | 'solid'
  | 'gradient'
  | 'image'

export type ImageLayout = 'fill' | 'fit' | 'pattern'

export const BACKDROPS = [
  { id: 'vanilla', label: 'Vanilla', color: '#f4efe6' },
  { id: 'blush', label: 'Blush', color: '#f6d9d6' },
  { id: 'studio', label: 'Studio', color: '#171514' },
  { id: 'transparent', label: 'Clear', color: 'transparent' }
] as const satisfies ReadonlyArray<{
  id: Exclude<BackdropId, 'solid' | 'gradient' | 'image'>
  label: string
  color: string
}>

export const GRADIENT_PRESETS = [
  { label: 'Sorbet', start: '#f6d9d6', end: '#f4efe6', angle: 135 },
  { label: 'Sky', start: '#d8eaff', end: '#f7f2ff', angle: 145 },
  { label: 'Lime', start: '#e0f1c2', end: '#fff2bd', angle: 120 },
  { label: 'Night', start: '#292242', end: '#171514', angle: 155 }
] as const

export type RenderBackdrop =
  | { kind: 'transparent' }
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; start: string; end: string; angle: number }
  | { kind: 'image'; color: string; layout: ImageLayout; patternSize: number }

export interface ImageDrawRect {
  x: number
  y: number
  width: number
  height: number
}

export function coverRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): ImageDrawRect {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: (targetWidth - width) / 2, y: (targetHeight - height) / 2, width, height }
}

export function containRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): ImageDrawRect {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: (targetWidth - width) / 2, y: (targetHeight - height) / 2, width, height }
}

function drawGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  backdrop: Extract<RenderBackdrop, { kind: 'gradient' }>
) {
  const radians = (backdrop.angle * Math.PI) / 180
  const radius = Math.abs(width * Math.sin(radians)) / 2 + Math.abs(height * Math.cos(radians)) / 2
  const centerX = width / 2
  const centerY = height / 2
  const offsetX = Math.sin(radians) * radius
  const offsetY = -Math.cos(radians) * radius
  const gradient = context.createLinearGradient(
    centerX - offsetX,
    centerY - offsetY,
    centerX + offsetX,
    centerY + offsetY
  )
  gradient.addColorStop(0, backdrop.start)
  gradient.addColorStop(1, backdrop.end)
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}

/** Draws the same backdrop used by the live preview into an export canvas. */
export function drawBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  backdrop: RenderBackdrop,
  image?: HTMLImageElement | null
) {
  if (backdrop.kind === 'transparent') return

  if (backdrop.kind === 'solid') {
    context.fillStyle = backdrop.color
    context.fillRect(0, 0, width, height)
    return
  }

  if (backdrop.kind === 'gradient') {
    drawGradient(context, width, height, backdrop)
    return
  }

  context.fillStyle = backdrop.color
  context.fillRect(0, 0, width, height)
  if (!image) return

  if (backdrop.layout === 'pattern') {
    const tileSize = Math.max(48, Math.round((backdrop.patternSize / 512) * width))
    const tile = document.createElement('canvas')
    tile.width = tileSize
    tile.height = tileSize
    const tileContext = tile.getContext('2d')
    if (!tileContext) return
    const rect = containRect(image.naturalWidth, image.naturalHeight, tileSize, tileSize)
    tileContext.drawImage(image, rect.x, rect.y, rect.width, rect.height)
    const pattern = context.createPattern(tile, 'repeat')
    if (pattern) {
      context.fillStyle = pattern
      context.fillRect(0, 0, width, height)
    }
    return
  }

  const rect =
    backdrop.layout === 'fill'
      ? coverRect(image.naturalWidth, image.naturalHeight, width, height)
      : containRect(image.naturalWidth, image.naturalHeight, width, height)
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height)
}
