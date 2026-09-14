import { gifIndexe, indexe, nouvellePalette, recense } from '@/ui/anime'
import type { VideoExportFormat, VideoExportQuality } from '@/ui/video'
import {
  expressionSequenceDurationMs,
  sampleExpressionSequence,
  type ExpressionSequence
} from '../expression-sequence'
import { STELLA_EXPRESSION_PRESETS } from './expression-presets'
import { interpolateFaceRigState } from './interpolate'
import { renderFaceRigSvg } from './render-svg'
import { STELLA_RIG_MANIFEST } from './stella-manifest'
import type { FaceRigState } from './types'

export type RigSequenceExportFormat = 'gif' | VideoExportFormat
export type RigSequenceExportBackground = 'studio' | 'transparent'

export type RigSequenceExportOptions = Readonly<{
  sequence: ExpressionSequence
  format: RigSequenceExportFormat
  size: 320 | 512 | 1024
  fps: 10 | 15 | 20 | 24 | 30
  quality: VideoExportQuality
  background: RigSequenceExportBackground
  onProgress?: (progress: number) => void
}>

export function rigStateForExpressionSequence(
  sequence: ExpressionSequence,
  elapsedMs: number
): FaceRigState {
  const sample = sampleExpressionSequence(sequence, elapsedMs)
  const from = STELLA_EXPRESSION_PRESETS[sample.from]
  if (!sample.inTransition || sample.from === sample.to) return from
  return interpolateFaceRigState(
    from,
    STELLA_EXPRESSION_PRESETS[sample.to],
    sample.easedProgress
  )
}

function studioBackdrop(
  context: CanvasRenderingContext2D,
  size: number
) {
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

async function drawRigFrame(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  options: RigSequenceExportOptions,
  elapsedMs: number
) {
  context.clearRect(0, 0, options.size, options.size)
  const opaqueVideo = options.format !== 'gif'
  if (options.background === 'studio' || opaqueVideo) {
    studioBackdrop(context, options.size)
  }

  const state = rigStateForExpressionSequence(options.sequence, elapsedMs)
  const svg = renderFaceRigSvg(
    STELLA_RIG_MANIFEST,
    state,
    `Exported modular rig at ${Math.round(elapsedMs)}ms`
  )
  const { image, url } = await loadSvgImage(svg)
  try {
    context.drawImage(image, 0, 0, options.size, options.size)
  } finally {
    URL.revokeObjectURL(url)
  }
  return canvas
}

/**
 * Encodes the exact modular SVG rig timeline rather than swapping raster sprites.
 * GIF may remain transparent; browser video codecs are exported over the studio backdrop.
 */
export async function createRigSequenceExport(
  options: RigSequenceExportOptions
): Promise<Blob> {
  const totalDurationMs = expressionSequenceDurationMs(options.sequence)
  if (totalDurationMs <= 0) throw new Error('The rig sequence has no duration')

  const frameCount = Math.max(2, Math.round((totalDurationMs / 1000) * options.fps))
  const canvas = document.createElement('canvas')
  canvas.width = options.size
  canvas.height = options.size
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('Canvas is unavailable')

  const elapsedForFrame = (index: number) => (index / frameCount) * totalDurationMs

  if (options.format !== 'gif') {
    const { versVideo } = await import('@/ui/video')
    return versVideo(
      canvas,
      frameCount,
      options.fps,
      async (index) => {
        await drawRigFrame(canvas, context, options, elapsedForFrame(index))
      },
      options.format,
      options.quality,
      (done, total) => options.onProgress?.(done / total)
    )
  }

  const frames: Uint8ClampedArray[] = []
  for (let index = 0; index < frameCount; index += 1) {
    await drawRigFrame(canvas, context, options, elapsedForFrame(index))
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
