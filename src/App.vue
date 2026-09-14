<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BackdropControls from '@/components/BackdropControls.vue'
import MotionExportDialog from '@/components/MotionExportDialog.vue'
import StellaHead from '@/components/StellaHead.vue'
import {
  EXPRESSIONS,
  HAIRS,
  MOTIONS,
  spritePath,
  type ExpressionId,
  type HairId,
  type MotionId
} from '@/stella/catalog'
import {
  BACKDROPS,
  drawBackdrop,
  type BackdropId,
  type ImageLayout,
  type RenderBackdrop
} from '@/stella/backdrop'
import type { MotionExportConfig } from '@/stella/motion-export'
import { createStellaFaceSvg } from '@/stella/vector-face'

type EditorTab = 'character' | 'motion'
const STORAGE_KEY = 'mini-head-studio'
const BACKDROP_IDS: readonly BackdropId[] = [
  ...BACKDROPS.map((item) => item.id),
  'solid',
  'gradient',
  'image'
]

const stored = (() => {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('stella-head-studio') ?? '{}'
    ) as Partial<{
      hair: HairId
      expression: ExpressionId
      motion: MotionId
      backdrop: BackdropId
      speed: number
      solidColor: string
      gradientStart: string
      gradientEnd: string
      gradientAngle: number
      imageLayout: ImageLayout
      patternSize: number
    }>
  } catch {
    return {}
  }
})()

const valid = <T extends string>(value: unknown, values: readonly T[], fallback: T) =>
  typeof value === 'string' && values.includes(value as T) ? (value as T) : fallback

const tab = ref<EditorTab>('character')
const hair = ref<HairId>(valid(stored.hair, HAIRS.map((item) => item.id), 'plush-bob'))
const expression = ref<ExpressionId>(
  valid(stored.expression, EXPRESSIONS.map((item) => item.id), 'happy')
)
const motion = ref<MotionId>(valid(stored.motion, MOTIONS.map((item) => item.id), 'idle'))
const storedBackdrop = valid(stored.backdrop, BACKDROP_IDS, 'vanilla')
const backdrop = ref<BackdropId>(storedBackdrop === 'image' ? 'vanilla' : storedBackdrop)
const solidColor = ref(typeof stored.solidColor === 'string' ? stored.solidColor : '#d8eaff')
const gradientStart = ref(typeof stored.gradientStart === 'string' ? stored.gradientStart : '#f6d9d6')
const gradientEnd = ref(typeof stored.gradientEnd === 'string' ? stored.gradientEnd : '#f4efe6')
const gradientAngle = ref(typeof stored.gradientAngle === 'number' ? stored.gradientAngle : 135)
const imageLayout = ref<ImageLayout>(
  valid(stored.imageLayout, ['fill', 'fit', 'pattern'] as const, 'fill')
)
const patternSize = ref(typeof stored.patternSize === 'number' ? stored.patternSize : 144)
const backdropImageUrl = ref<string | null>(null)
const speed = ref(typeof stored.speed === 'number' ? Math.min(1.5, Math.max(0.5, stored.speed)) : 1)
const playing = ref(true)
const motionKey = ref(0)
const exporting = ref<'png' | 'motion' | null>(null)
const exportProgress = ref(0)
const exportMenuOpen = ref(false)
const motionExportOpen = ref(false)
const supportedVideoFormats = ref<Array<'mp4' | 'webm'>>([])
const followX = ref(0)
const followY = ref(0)
const toast = ref('')
let toastTimer = 0

const activeHair = computed(() => HAIRS.find((item) => item.id === hair.value) ?? HAIRS[0])
const activeExpression = computed(
  () => EXPRESSIONS.find((item) => item.id === expression.value) ?? EXPRESSIONS[0]
)
const activeMotion = computed(() => MOTIONS.find((item) => item.id === motion.value) ?? MOTIONS[0])
const activeBackdropLabel = computed(() => {
  if (backdrop.value === 'solid') return 'Custom color'
  if (backdrop.value === 'gradient') return 'Custom gradient'
  if (backdrop.value === 'image') return 'Custom image'
  return BACKDROPS.find((item) => item.id === backdrop.value)?.label ?? BACKDROPS[0]!.label
})
const headSrc = computed(() => spritePath(hair.value, expression.value))
const renderBackdrop = computed<RenderBackdrop>(() => {
  if (backdrop.value === 'transparent') return { kind: 'transparent' }
  if (backdrop.value === 'solid') return { kind: 'solid', color: solidColor.value }
  if (backdrop.value === 'gradient') {
    return {
      kind: 'gradient',
      start: gradientStart.value,
      end: gradientEnd.value,
      angle: gradientAngle.value
    }
  }
  if (backdrop.value === 'image' && backdropImageUrl.value) {
    return {
      kind: 'image',
      color: solidColor.value,
      layout: imageLayout.value,
      patternSize: patternSize.value
    }
  }
  const preset = BACKDROPS.find((item) => item.id === backdrop.value) ?? BACKDROPS[0]!
  return { kind: 'solid', color: preset.color }
})
const stageStyle = computed(() => {
  const current = renderBackdrop.value
  if (current.kind === 'solid') return { backgroundColor: current.color, backgroundImage: 'none' }
  if (current.kind === 'gradient') {
    return {
      backgroundColor: current.start,
      backgroundImage: `linear-gradient(${current.angle}deg, ${current.start}, ${current.end})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat'
    }
  }
  if (current.kind === 'image' && backdropImageUrl.value) {
    return {
      backgroundColor: current.color,
      backgroundImage: `url(${backdropImageUrl.value})`,
      backgroundSize:
        current.layout === 'pattern' ? `${current.patternSize}px ${current.patternSize}px` : current.layout === 'fill' ? 'cover' : 'contain',
      backgroundRepeat: current.layout === 'pattern' ? 'repeat' : 'no-repeat',
      backgroundPosition: 'center'
    }
  }
  return {}
})
const transportStyle = computed(() => ({
  animationDuration: `${activeMotion.value.seconds / speed.value}s`,
  animationPlayState: playing.value ? 'running' : 'paused'
}))

watch(
  [
    hair,
    expression,
    motion,
    backdrop,
    speed,
    solidColor,
    gradientStart,
    gradientEnd,
    gradientAngle,
    imageLayout,
    patternSize
  ],
  () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hair: hair.value,
        expression: expression.value,
        motion: motion.value,
        backdrop: backdrop.value === 'image' ? 'vanilla' : backdrop.value,
        speed: speed.value,
        solidColor: solidColor.value,
        gradientStart: gradientStart.value,
        gradientEnd: gradientEnd.value,
        gradientAngle: gradientAngle.value,
        imageLayout: imageLayout.value,
        patternSize: patternSize.value
      })
    )
  }
)

function replay() {
  playing.value = true
  motionKey.value += 1
}

function chooseMotion(id: MotionId) {
  motion.value = id
  if (id !== 'follow') resetPointer()
  replay()
}

function announce(message: string) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 2200)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function exportPng() {
  if (exporting.value) return
  exportMenuOpen.value = false
  exporting.value = 'png'
  try {
    const image = await loadImage(headSrc.value)
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')

    const backdropImage =
      renderBackdrop.value.kind === 'image' && backdropImageUrl.value
        ? await loadImage(backdropImageUrl.value)
        : null
    drawBackdrop(context, canvas.width, canvas.height, renderBackdrop.value, backdropImage)

    const size = 850
    context.drawImage(image, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size)

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('PNG export failed'))), 'image/png')
    )
    downloadBlob(blob, `stella-${hair.value}-${expression.value}.png`)
    announce('PNG saved to your downloads')
  } catch {
    announce('Could not export this image')
  } finally {
    exporting.value = null
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function exportFaceSvg() {
  exportMenuOpen.value = false
  const svg = createStellaFaceSvg(expression.value)
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `stella-${expression.value}-face.svg`)
  announce('Scalable face SVG saved to your downloads')
}

async function exportMotion(config: MotionExportConfig) {
  if (exporting.value) return
  exportMenuOpen.value = false
  exporting.value = 'motion'
  exportProgress.value = 0
  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const image = await loadImage(headSrc.value)
    const { createStellaMotionExport } = await import('@/stella/motion-export')
    let selectedBackdrop: RenderBackdrop
    if (config.background === 'current') {
      selectedBackdrop = renderBackdrop.value
    } else if (config.background === 'transparent') {
      selectedBackdrop = { kind: 'transparent' }
    } else {
      const preset = BACKDROPS.find((item) => item.id === config.background) ?? BACKDROPS[0]!
      selectedBackdrop = { kind: 'solid', color: preset.color }
    }
    if (config.format !== 'gif' && selectedBackdrop.kind === 'transparent') {
      selectedBackdrop = { kind: 'solid', color: BACKDROPS[0]!.color }
    }
    const backdropImage =
      selectedBackdrop.kind === 'image' && backdropImageUrl.value
        ? await loadImage(backdropImageUrl.value)
        : null
    const blob = await createStellaMotionExport({
      ...config,
      image,
      motion: motion.value,
      seconds: activeMotion.value.seconds,
      speed: speed.value,
      backdrop: selectedBackdrop,
      backdropImage,
      onProgress: (progress) => (exportProgress.value = progress)
    })
    downloadBlob(blob, `stella-${hair.value}-${expression.value}-${motion.value}.${config.format}`)
    announce(`${config.format.toUpperCase()} animation saved to your downloads`)
  } catch (error) {
    console.error('[motion-export] failed', error)
    announce('Could not export this animation')
  } finally {
    exporting.value = null
    exportProgress.value = 0
  }
}

function onExportFocusout(event: FocusEvent) {
  const next = event.relatedTarget
  if (!(next instanceof Node) || !(event.currentTarget as HTMLElement).contains(next)) {
    exportMenuOpen.value = false
  }
}

function randomize() {
  hair.value = HAIRS[Math.floor(Math.random() * HAIRS.length)]!.id
  expression.value = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)]!.id
  motion.value = MOTIONS[Math.floor(Math.random() * MOTIONS.length)]!.id
  replay()
}

function trackPointer(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  const frame = event.currentTarget as HTMLElement
  const rect = frame.getBoundingClientRect()
  followX.value = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)))
  followY.value = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)))
}

function resetPointer() {
  followX.value = 0
  followY.value = 0
}

function onKeydown(event: KeyboardEvent) {
  if (event.code === 'Escape') {
    exportMenuOpen.value = false
    return
  }
  if (event.code !== 'Space' || event.target instanceof HTMLInputElement) return
  event.preventDefault()
  playing.value = !playing.value
}

window.addEventListener('keydown', onKeydown)
onMounted(async () => {
  if (typeof VideoEncoder === 'undefined') return
  const candidates = [
    { format: 'mp4' as const, codec: 'avc1.42001f' },
    { format: 'webm' as const, codec: 'vp09.00.10.08' }
  ]
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const result = await VideoEncoder.isConfigSupported({
          codec: candidate.codec,
          width: 512,
          height: 512,
          bitrate: 4_000_000,
          framerate: 30
        })
        return result.supported ? candidate.format : null
      } catch {
        return null
      }
    })
  )
  supportedVideoFormats.value = results.filter((format): format is 'mp4' | 'webm' => format !== null)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.clearTimeout(toastTimer)
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Mini Head Studio home">
        <span class="brand__star">★</span><span>MINI</span><small>HEAD STUDIO</small>
      </a>
      <div class="topbar__actions">
        <button class="button button--secondary randomize-button" type="button" title="Randomize Stella" @click="randomize">
          <span class="randomize-button__icon" aria-hidden="true">✦</span><span class="randomize-button__label">Randomize</span>
        </button>
        <div class="export-control" @focusout="onExportFocusout">
          <button class="button button--dark export-control__main" type="button" :disabled="!!exporting" @click="exportPng">
            <span>↓</span>{{ exporting === 'png' ? 'Exporting…' : exporting === 'motion' ? `Encoding ${Math.round(exportProgress * 100)}%` : 'Export PNG' }}
          </button>
          <button
            class="button button--dark export-control__toggle"
            type="button"
            :disabled="!!exporting"
            aria-label="More export formats"
            :aria-expanded="exportMenuOpen"
            @click="exportMenuOpen = !exportMenuOpen"
          >
            ▾
          </button>
          <div v-if="exportMenuOpen" class="export-menu">
            <button type="button" @click="exportMenuOpen = false; motionExportOpen = true">
              <span class="export-menu__icon">MOV</span>
              <span><strong>Motion export…</strong><small>GIF, MP4, WebM & settings</small></span>
            </button>
            <button type="button" @click="exportFaceSvg">
              <span class="export-menu__icon export-menu__icon--svg">SVG</span>
              <span><strong>Vector face SVG</strong><small>Expression and face shape only</small></span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="workspace">
      <nav class="rail" aria-label="Editor sections">
        <button class="rail__button" :class="{ 'rail__button--active': tab === 'character' }" type="button" @click="tab = 'character'">
          <span class="rail__icon">◉</span><span>Character</span>
        </button>
        <button class="rail__button" :class="{ 'rail__button--active': tab === 'motion' }" type="button" @click="tab = 'motion'">
          <span class="rail__icon">✦</span><span>Motion</span>
        </button>
        <div class="rail__rule" />
        <button class="rail__button rail__button--surprise" type="button" @click="randomize">
          <span class="rail__icon" aria-hidden="true">✦</span><span>Surprise me</span>
        </button>
      </nav>

      <section class="preview-column" aria-label="Stella preview">
        <div class="preview-copy">
          <span class="eyebrow">LIVE CHARACTER LAB</span>
          <h1>Make a mood.<br />Give it motion.</h1>
          <p>{{ activeHair.label }} · {{ activeExpression.label }} · {{ activeMotion.label }}</p>
        </div>

        <div
          class="preview-frame"
          :class="[`preview-frame--${backdrop}`, { 'preview-frame--follow': motion === 'follow' }]"
          :style="stageStyle"
          @pointermove="trackPointer"
          @pointerleave="resetPointer"
        >
          <div class="preview-frame__grid" aria-hidden="true" />
          <div class="preview-frame__badge"><span /> LIVE PREVIEW</div>
          <StellaHead
            :src="headSrc"
            :alt="`Stella with ${activeHair.label} hair and a ${activeExpression.label} expression`"
            :motion="motion"
            :motion-key="motionKey"
            :playing="playing"
            :speed="speed"
            :follow-x="followX"
            :follow-y="followY"
          />
          <div class="preview-frame__caption">
            <strong>{{ activeExpression.label }}</strong><span>{{ activeMotion.detail }}</span>
          </div>
        </div>

        <div class="transport" aria-label="Animation playback controls">
          <button class="transport__play" type="button" @click="playing = !playing">{{ playing ? 'Ⅱ' : '▶' }}</button>
          <button class="transport__replay" type="button" @click="replay">↻ Replay</button>
          <div class="transport__track"><span :key="motionKey" :style="transportStyle" /></div>
          <label class="speed-control">
            <span>{{ speed.toFixed(1) }}×</span>
            <input v-model.number="speed" type="range" min="0.5" max="1.5" step="0.1" aria-label="Animation speed" />
          </label>
        </div>
      </section>

      <aside class="panel">
        <template v-if="tab === 'character'">
          <div class="panel__heading">
            <div><span class="eyebrow">01 · BUILD</span><h2>Style Stella</h2></div>
            <span class="panel__count">{{ HAIRS.length * EXPRESSIONS.length }} looks</span>
          </div>

          <section class="control-group">
            <div class="control-group__heading"><h3>Hair</h3><span>{{ activeHair.detail }}</span></div>
            <div class="hair-grid">
              <button
                v-for="item in HAIRS"
                :key="item.id"
                class="asset-card"
                :class="{ 'asset-card--active': hair === item.id }"
                type="button"
                :aria-pressed="hair === item.id"
                @click="hair = item.id"
              >
                <span class="asset-card__image"><StellaHead :src="spritePath(item.id, 'happy')" :alt="item.label" compact /></span>
                <span>{{ item.label }}</span><i>✓</i>
              </button>
            </div>
          </section>

          <section class="control-group">
            <div class="control-group__heading"><h3>Expression</h3><span>{{ activeExpression.detail }}</span></div>
            <div class="expression-grid">
              <button
                v-for="item in EXPRESSIONS"
                :key="item.id"
                class="expression-card"
                :class="{ 'expression-card--active': expression === item.id }"
                type="button"
                :aria-pressed="expression === item.id"
                @click="expression = item.id"
              >
                <img :src="spritePath(hair, item.id)" alt="" /><span>{{ item.label }}</span>
              </button>
            </div>
          </section>

          <section class="control-group control-group--last">
            <div class="control-group__heading"><h3>Backdrop</h3><span>{{ activeBackdropLabel }}</span></div>
            <BackdropControls
              v-model:mode="backdrop"
              v-model:solid-color="solidColor"
              v-model:gradient-start="gradientStart"
              v-model:gradient-end="gradientEnd"
              v-model:gradient-angle="gradientAngle"
              v-model:image-url="backdropImageUrl"
              v-model:image-layout="imageLayout"
              v-model:pattern-size="patternSize"
            />
          </section>
        </template>

        <template v-else>
          <div class="panel__heading">
            <div><span class="eyebrow">02 · ANIMATE</span><h2>Pick a motion</h2></div>
            <span class="panel__count">{{ MOTIONS.length }} presets</span>
          </div>
          <p class="panel__intro">Short, loopable reactions for messages, profiles and social posts.</p>
          <div class="motion-list">
            <button
              v-for="item in MOTIONS"
              :key="item.id"
              class="motion-card"
              :class="{ 'motion-card--active': motion === item.id }"
              type="button"
              :aria-pressed="motion === item.id"
              @click="chooseMotion(item.id)"
            >
              <span class="motion-card__glyph">{{ item.glyph }}</span>
              <span class="motion-card__copy"><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></span>
              <span class="motion-card__time">{{ item.duration }}</span>
            </button>
          </div>
          <div v-if="motion === 'follow'" class="motion-tip"><span>LIVE</span>Move your pointer across the canvas</div>
          <div v-else class="motion-tip"><span>SPACE</span>Pause or resume the preview</div>
        </template>
      </aside>
    </main>

    <MotionExportDialog
      v-model:open="motionExportOpen"
      :current-backdrop="backdrop"
      :duration="activeMotion.seconds / speed"
      :supported-video-formats="supportedVideoFormats"
      @export="exportMotion"
    />
    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </div>
</template>
