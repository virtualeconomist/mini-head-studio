import { gifIndexe, indexe, nouvellePalette, recense } from '@/ui/anime'
import type { VideoExportFormat, VideoExportQuality } from '@/ui/video'
import type { MotionId } from './catalog'
import { drawBackdrop, type RenderBackdrop } from './backdrop'
import { motionPose } from './motion'

export type MotionExportFormat = 'gif' | VideoExportFormat
export type MotionExportBackground = 'current' | 'vanilla' | 'blush' | 'studio' | 'transparent'

export interface MotionExportConfig {
  format: MotionExportFormat
  size: 320 | 512 | 1024
  fps: 10 | 15 | 20 | 24 | 30
  quality: VideoExportQuality
  background: MotionExportBackground
  watermark: boolean
  watermarkText: string
  watermarkOpacity: number
}

export interface StellaMotionExportOptions extends MotionExportConfig {
  image: HTMLImageElement
  motion: MotionId
  seconds: number
  speed: number
  backdrop: RenderBackdrop
  backdropImage?: HTMLImageElement | null
  onProgress?: (progress: number) => void
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

function drawWatermark(context: CanvasRenderingContext2D, options: StellaMotionExportOptions) {
  if (!options.watermark) return
  const label = options.watermarkText.trim().slice(0, 40) || 'Mini Head Studio'
  const fontSize = Math.max(11, Math.round(options.size * 0.027))
  const paddingX = Math.round(fontSize * 0.72)
  const height = Math.round(fontSize * 2.05)
  const margin = Math.round(options.size * 0.035)
  context.save()
  context.font = `800 ${fontSize}px Inter, ui-sans-serif, sans-serif`
  const width = Math.ceil(context.measureText(label).width + paddingX * 2)
  const x = options.size - width - margin
  const y = options.size - height - margin
  context.globalAlpha = options.watermarkOpacity
  context.fillStyle = '#ffffff'
  roundedRect(context, x, y, width, height, height / 2)
  context.fill()
  context.globalAlpha = Math.min(1, options.watermarkOpacity + 0.18)
  context.fillStyle = '#171514'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, x + width / 2, y + height / 2 + 0.5)
  context.restore()
}

function drawFrame(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  options: StellaMotionExportOptions,
  progress: number
) {
  context.clearRect(0, 0, options.size, options.size)
  drawBackdrop(context, options.size, options.size, options.backdrop, options.backdropImage)

  const current = motionPose(options.motion, progress)
  const headSize = Math.round(options.size * 0.84)
  const centerX = options.size / 2 + current.x * headSize
  const centerY = options.size / 2 + current.y * headSize

  context.save()
  context.globalAlpha = 0.16
  context.fillStyle = '#1c140f'
  context.beginPath()
  context.ellipse(
    centerX,
    options.size * 0.76,
    headSize * 0.25,
    headSize * 0.028,
    0,
    0,
    Math.PI * 2
  )
  context.fill()
  context.restore()

  context.save()
  context.translate(centerX, centerY)
  context.rotate((current.rotation * Math.PI) / 180)
  context.scale(current.scaleX, current.scaleY)
  context.drawImage(options.image, -headSize / 2, -headSize / 2, headSize, headSize)
  context.restore()
  drawWatermark(context, options)
  return canvas
}

/** Builds GIF, MP4, or WebM from deterministic frames rather than screen recording. */
export async function createStellaMotionExport(options: StellaMotionExportOptions): Promise<Blob> {
  const duration = options.seconds / options.speed
  const frameCount = Math.max(2, Math.round(duration * options.fps))
  const canvas = document.createElement('canvas')
  canvas.width = options.size
  canvas.height = options.size
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('Canvas is unavailable')

  if (options.format !== 'gif') {
    const { versVideo } = await import('@/ui/video')
    return versVideo(
      canvas,
      frameCount,
      options.fps,
      (index) => {
        drawFrame(canvas, context, options, index / frameCount)
      },
      options.format,
      options.quality,
      (done, total) => options.onProgress?.(done / total)
    )
  }

  const frames: Uint8ClampedArray[] = []
  for (let index = 0; index < frameCount; index++) {
    drawFrame(canvas, context, options, index / frameCount)
    frames.push(context.getImageData(0, 0, options.size, options.size).data)
    options.onProgress?.((index + 1) / (frameCount * 3))
    if (index % 4 === 3) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  const palette = nouvellePalette()
  for (let index = 0; index < frames.length; index++) {
    recense(palette, frames[index]!)
    options.onProgress?.((frameCount + index + 1) / (frameCount * 3))
    if (index % 4 === 3) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  const indexed: Uint8Array[] = []
  for (let index = 0; index < frames.length; index++) {
    indexed.push(indexe(palette, frames[index]!))
    options.onProgress?.((frameCount * 2 + index + 1) / (frameCount * 3))
    if (index % 4 === 3) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  const bytes = gifIndexe(
    palette,
    indexed,
    options.size,
    options.size,
    Math.round(1000 / options.fps)
  )
  options.onProgress?.(1)
  return new Blob([bytes], { type: 'image/gif' })
}
