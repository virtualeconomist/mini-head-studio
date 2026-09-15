import { gifIndexe, indexe, nouvellePalette, recense } from '@/ui/anime'
import type { VideoExportFormat, VideoExportQuality } from '@/ui/video'
import { EXPRESSIONS, HAIRS, spritePath, type ExpressionId, type MotionId } from './catalog'
import { drawBackdrop, type RenderBackdrop } from './backdrop'
import {
  expressionSequenceDurationMs,
  sampleExpressionSequence,
  sequenceFromStoredExpressionLoop,
  type ExpressionSequence,
  type SequenceTransitionStyle
} from './expression-sequence'
import { motionPose, type MotionPose } from './motion'

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

type PreparedExpressionSequence = {
  sequence: ExpressionSequence
  images: Partial<Record<ExpressionId, HTMLImageElement>>
}

type ExpressionVisual = {
  alpha: number
  scaleX: number
  scaleY: number
  offsetY: number
  rotation: number
  blur: number
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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function hairRowFromSource(src: string) {
  const match = src.match(/stella-sprite-(\d+)\.webp/)
  if (!match) return 0
  const index = Number(match[1])
  if (!Number.isFinite(index)) return 0
  return Math.max(0, Math.min(HAIRS.length - 1, Math.floor(index / EXPRESSIONS.length)))
}

async function prepareExpressionSequence(
  options: StellaMotionExportOptions
): Promise<PreparedExpressionSequence | null> {
  const sequence = sequenceFromStoredExpressionLoop()
  if (!sequence) return null

  const hair = HAIRS[hairRowFromSource(options.image.src)] ?? HAIRS[0]!
  const expressions = [...new Set(sequence.steps.map((step) => step.expression))]
  const images: Partial<Record<ExpressionId, HTMLImageElement>> = {}

  await Promise.all(
    expressions.map(async (expression) => {
      images[expression] = await loadImage(spritePath(hair.id, expression))
    })
  )

  return { sequence, images }
}

function transitionVisual(
  style: SequenceTransitionStyle,
  progress: number,
  incoming: boolean
): ExpressionVisual {
  const p = Math.max(0, Math.min(1, progress))
  const alpha = incoming ? p : 1 - p

  if (style === 'pop') {
    return incoming
      ? { alpha, scaleX: 0.82 + p * 0.18, scaleY: 0.82 + p * 0.18, offsetY: 0.015 * (1 - p), rotation: -2 * (1 - p), blur: 0 }
      : { alpha, scaleX: 1 + p * 0.025, scaleY: 1 + p * 0.025, offsetY: -0.008 * p, rotation: 1.5 * p, blur: 0 }
  }

  if (style === 'blink') {
    return incoming
      ? { alpha, scaleX: 0.98 + p * 0.02, scaleY: 0.08 + p * 0.92, offsetY: 0, rotation: 0, blur: 1.5 * (1 - p) }
      : { alpha, scaleX: 1, scaleY: Math.max(0.08, 1 - p * 0.92), offsetY: 0, rotation: 0, blur: 1.5 * p }
  }

  if (style === 'snap') {
    return incoming
      ? { alpha, scaleX: 1.07 - p * 0.07, scaleY: 1.07 - p * 0.07, offsetY: 0.05 * (1 - p), rotation: 0, blur: 7 * (1 - p) }
      : { alpha, scaleX: 1 - p * 0.025, scaleY: 1 - p * 0.025, offsetY: -0.018 * p, rotation: 0, blur: 3 * p }
  }

  return { alpha, scaleX: 1, scaleY: 1, offsetY: 0, rotation: 0, blur: 0 }
}

function drawHeadImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  pose: MotionPose,
  centerX: number,
  centerY: number,
  headSize: number,
  visual: ExpressionVisual
) {
  context.save()
  context.globalAlpha = visual.alpha
  context.filter = visual.blur > 0.01 ? `blur(${visual.blur.toFixed(2)}px)` : 'none'
  context.translate(centerX, centerY + visual.offsetY * headSize)
  context.rotate(((pose.rotation + visual.rotation) * Math.PI) / 180)
  context.scale(pose.scaleX * visual.scaleX, pose.scaleY * visual.scaleY)
  context.drawImage(image, -headSize / 2, -headSize / 2, headSize, headSize)
  context.restore()
}

function drawFrame(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  options: StellaMotionExportOptions,
  elapsedMs: number,
  totalDurationMs: number,
  motionCycleCount: number,
  preparedSequence: PreparedExpressionSequence | null
) {
  context.clearRect(0, 0, options.size, options.size)
  drawBackdrop(context, options.size, options.size, options.backdrop, options.backdropImage)

  const timelineProgress = totalDurationMs > 0 ? elapsedMs / totalDurationMs : 0
  const current = motionPose(options.motion, timelineProgress * motionCycleCount)
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

  if (!preparedSequence) {
    drawHeadImage(
      context,
      options.image,
      current,
      centerX,
      centerY,
      headSize,
      { alpha: 1, scaleX: 1, scaleY: 1, offsetY: 0, rotation: 0, blur: 0 }
    )
  } else {
    const sample = sampleExpressionSequence(preparedSequence.sequence, elapsedMs)
    const fromImage = preparedSequence.images[sample.from] ?? options.image
    const toImage = preparedSequence.images[sample.to] ?? fromImage

    if (!sample.inTransition || sample.from === sample.to) {
      drawHeadImage(
        context,
        fromImage,
        current,
        centerX,
        centerY,
        headSize,
        { alpha: 1, scaleX: 1, scaleY: 1, offsetY: 0, rotation: 0, blur: 0 }
      )
    } else {
      drawHeadImage(
        context,
        fromImage,
        current,
        centerX,
        centerY,
        headSize,
        transitionVisual(preparedSequence.sequence.transitionStyle, sample.easedProgress, false)
      )
      drawHeadImage(
        context,
        toImage,
        current,
        centerX,
        centerY,
        headSize,
        transitionVisual(preparedSequence.sequence.transitionStyle, sample.easedProgress, true)
      )
    }
  }

  drawWatermark(context, options)
  return canvas
}

/** Builds GIF, MP4, or WebM from deterministic frames rather than screen recording. */
export async function createStellaMotionExport(options: StellaMotionExportOptions): Promise<Blob> {
  const preparedSequence = await prepareExpressionSequence(options)
  const motionCycleMs = Math.max(1, (options.seconds / options.speed) * 1000)
  const totalDurationMs = preparedSequence
    ? expressionSequenceDurationMs(preparedSequence.sequence)
    : motionCycleMs
  const durationSeconds = totalDurationMs / 1000
  const frameCount = Math.max(2, Math.round(durationSeconds * options.fps))
  // Keep the exported head motion loop seamless while staying close to the requested speed.
  const motionCycleCount = preparedSequence
    ? Math.max(1, Math.round(totalDurationMs / motionCycleMs))
    : 1

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
        drawFrame(
          canvas,
          context,
          options,
          (index / frameCount) * totalDurationMs,
          totalDurationMs,
          motionCycleCount,
          preparedSequence
        )
      },
      options.format,
      options.quality,
      (done, total) => options.onProgress?.(done / total)
    )
  }

  const frames: Uint8ClampedArray[] = []
  for (let index = 0; index < frameCount; index++) {
    drawFrame(
      canvas,
      context,
      options,
      (index / frameCount) * totalDurationMs,
      totalDurationMs,
      motionCycleCount,
      preparedSequence
    )
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
