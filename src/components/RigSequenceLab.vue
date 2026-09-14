<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EXPRESSIONS, type ExpressionId } from '@/stella/catalog'
import {
  expressionSequenceDurationMs,
  sampleExpressionSequence,
  type ExpressionSequence,
  type SequenceEasingId
} from '@/stella/expression-sequence'
import {
  createRigSequenceExport,
  STELLA_EXPRESSION_PRESETS,
  STELLA_RIG_MANIFEST,
  interpolateFaceRigState,
  renderFaceRigSvg,
  type RigSequenceExportBackground,
  type RigSequenceExportFormat
} from '@/stella/rig'

const STORAGE_KEY = 'mini-head-rig-sequencer'
const defaultOrder: ExpressionId[] = ['happy', 'wink', 'cheeky', 'love']
const defaultHolds: Record<ExpressionId, number> = {
  happy: 420,
  wink: 300,
  surprised: 360,
  cheeky: 360,
  sleepy: 520,
  love: 460
}

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<{
      order: ExpressionId[]
      holds: Partial<Record<ExpressionId, number>>
      transitionMs: number
      easing: SequenceEasingId
      easeStrength: number
      seamless: boolean
    }>
  } catch {
    return {}
  }
})()

const validOrder = Array.isArray(saved.order)
  ? saved.order.filter((id): id is ExpressionId => EXPRESSIONS.some((item) => item.id === id)).slice(0, 6)
  : []
const order = ref<ExpressionId[]>(validOrder.length >= 2 ? validOrder : defaultOrder)
const holds = ref<Record<ExpressionId, number>>({
  ...defaultHolds,
  ...(saved.holds ?? {})
})
const transitionMs = ref(typeof saved.transitionMs === 'number' ? Math.max(100, Math.min(1200, saved.transitionMs)) : 420)
const easing = ref<SequenceEasingId>(
  ['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(saved.easing ?? '')
    ? saved.easing as SequenceEasingId
    : 'ease-in-out'
)
const easeStrength = ref(typeof saved.easeStrength === 'number' ? Math.max(1, Math.min(4, saved.easeStrength)) : 2.4)
const seamless = ref(saved.seamless !== false)
const playing = ref(false)
const playheadMs = ref(0)
const exportFormat = ref<RigSequenceExportFormat>('gif')
const exportSize = ref<320 | 512 | 1024>(512)
const exportFps = ref<10 | 15 | 20 | 24 | 30>(20)
const exportBackground = ref<RigSequenceExportBackground>('studio')
const exporting = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
let frame = 0
let lastFrameAt = 0
let dragIndex = -1

const sequence = computed<ExpressionSequence>(() => ({
  steps: order.value.map((expression) => ({
    expression,
    holdMs: Math.max(80, Math.min(1600, holds.value[expression] ?? 420))
  })),
  transitionMs: transitionMs.value,
  easing: easing.value,
  easeStrength: easeStrength.value,
  seamless: seamless.value,
  transitionStyle: 'crossfade'
}))
const durationMs = computed(() => expressionSequenceDurationMs(sequence.value))
const sample = computed(() => sampleExpressionSequence(sequence.value, playheadMs.value))
const rigState = computed(() => {
  const from = STELLA_EXPRESSION_PRESETS[sample.value.from]
  if (!sample.value.inTransition || sample.value.from === sample.value.to) return from
  return interpolateFaceRigState(
    from,
    STELLA_EXPRESSION_PRESETS[sample.value.to],
    sample.value.easedProgress
  )
})
const renderedSvg = computed(() => renderFaceRigSvg(
  STELLA_RIG_MANIFEST,
  rigState.value,
  `Rig sequence ${sample.value.from} to ${sample.value.to}`
))
const durationLabel = computed(() => `${(durationMs.value / 1000).toFixed(2)}s loop`)
const statusLabel = computed(() => sample.value.inTransition
  ? `${sample.value.from} → ${sample.value.to} · ${Math.round(sample.value.easedProgress * 100)}%`
  : `${sample.value.from} · hold`
)

watch([order, holds, transitionMs, easing, easeStrength, seamless], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    order: order.value,
    holds: holds.value,
    transitionMs: transitionMs.value,
    easing: easing.value,
    easeStrength: easeStrength.value,
    seamless: seamless.value
  }))
  if (playheadMs.value >= durationMs.value) playheadMs.value = 0
}, { deep: true })

function tick(now: number) {
  if (!playing.value) return
  if (!lastFrameAt) lastFrameAt = now
  const delta = now - lastFrameAt
  lastFrameAt = now
  const duration = Math.max(1, durationMs.value)
  playheadMs.value = (playheadMs.value + delta) % duration
  frame = requestAnimationFrame(tick)
}

function togglePlayback() {
  playing.value = !playing.value
  cancelAnimationFrame(frame)
  lastFrameAt = 0
  if (playing.value) frame = requestAnimationFrame(tick)
}

function restart() {
  playheadMs.value = 0
  lastFrameAt = 0
}

function toggleExpression(expression: ExpressionId) {
  const index = order.value.indexOf(expression)
  if (index >= 0) {
    if (order.value.length <= 2) return
    order.value.splice(index, 1)
  } else if (order.value.length < 6) {
    order.value.push(expression)
  }
  restart()
}

function move(index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= order.value.length) return
  const next = [...order.value]
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item!)
  order.value = next
  restart()
}

function onDragStart(index: number) {
  dragIndex = index
}

function onDrop(index: number) {
  if (dragIndex < 0 || dragIndex === index) return
  const next = [...order.value]
  const [item] = next.splice(dragIndex, 1)
  next.splice(index, 0, item!)
  order.value = next
  dragIndex = -1
  restart()
}

function labelFor(expression: ExpressionId) {
  return EXPRESSIONS.find((item) => item.id === expression)?.label ?? expression
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function exportRigLoop() {
  if (exporting.value) return
  const resumePlayback = playing.value
  if (resumePlayback) {
    playing.value = false
    cancelAnimationFrame(frame)
  }

  exporting.value = true
  exportProgress.value = 0
  exportStatus.value = 'Rendering modular rig frames…'

  try {
    const blob = await createRigSequenceExport({
      sequence: sequence.value,
      format: exportFormat.value,
      size: exportSize.value,
      fps: exportFps.value,
      quality: 'high',
      background: exportFormat.value === 'gif' ? exportBackground.value : 'studio',
      onProgress: (progress) => {
        exportProgress.value = progress
      }
    })
    const extension = exportFormat.value
    downloadBlob(blob, `stella-modular-rig-loop.${extension}`)
    exportStatus.value = `${extension.toUpperCase()} exported from the live modular rig timeline.`
  } catch (error) {
    exportStatus.value = error instanceof Error ? error.message : 'Rig export failed'
  } finally {
    exporting.value = false
    if (resumePlayback) {
      playing.value = true
      lastFrameAt = 0
      frame = requestAnimationFrame(tick)
    }
  }
}

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <section class="sequence-lab" aria-label="Multi-expression rig sequencer">
    <div class="sequence-lab__heading">
      <div>
        <span class="sequence-lab__eyebrow">NEXT STEP · LIVE RIG TIMELINE</span>
        <h2>Expression Sequencer</h2>
        <p>Build a real parameter-driven face loop. Every transition below morphs the modular eyes, brows, mouth and blush instead of swapping baked images.</p>
      </div>
      <span class="sequence-lab__duration">{{ durationLabel }}</span>
    </div>

    <div class="sequence-palette">
      <button
        v-for="item in EXPRESSIONS"
        :key="item.id"
        type="button"
        :class="{ 'is-selected': order.includes(item.id) }"
        @click="toggleExpression(item.id)"
      >
        <span>{{ order.indexOf(item.id) >= 0 ? order.indexOf(item.id) + 1 : '+' }}</span>
        {{ item.label }}
      </button>
    </div>

    <div class="sequence-layout">
      <div class="sequence-preview">
        <div class="sequence-preview__stage" v-html="renderedSvg" />
        <div class="sequence-preview__meta">
          <strong>{{ statusLabel }}</strong>
          <span>{{ easing }} · {{ transitionMs }}ms transition</span>
        </div>
        <div class="sequence-transport">
          <button type="button" @click="togglePlayback">{{ playing ? 'Ⅱ Pause' : '▶ Play loop' }}</button>
          <button type="button" @click="restart">↻ Restart</button>
          <input
            v-model.number="playheadMs"
            type="range"
            min="0"
            :max="Math.max(1, durationMs)"
            step="1"
            aria-label="Rig sequence playhead"
          />
          <span>{{ (playheadMs / 1000).toFixed(2) }}s</span>
        </div>

        <div class="sequence-export">
          <div class="sequence-export__head">
            <div>
              <span>DIRECT RIG EXPORT</span>
              <strong>Export this exact parametric loop</strong>
            </div>
            <span>FACE / HEAD ONLY</span>
          </div>
          <div class="sequence-export__controls">
            <label>
              <span>Format</span>
              <select v-model="exportFormat">
                <option value="gif">GIF</option>
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
              </select>
            </label>
            <label>
              <span>Size</span>
              <select v-model.number="exportSize">
                <option :value="320">320</option>
                <option :value="512">512</option>
                <option :value="1024">1024</option>
              </select>
            </label>
            <label>
              <span>FPS</span>
              <select v-model.number="exportFps">
                <option :value="10">10</option>
                <option :value="15">15</option>
                <option :value="20">20</option>
                <option :value="24">24</option>
                <option :value="30">30</option>
              </select>
            </label>
            <label>
              <span>Background</span>
              <select v-model="exportBackground" :disabled="exportFormat !== 'gif'">
                <option value="studio">Studio</option>
                <option value="transparent">Transparent</option>
              </select>
            </label>
          </div>
          <button type="button" class="sequence-export__button" :disabled="exporting" @click="exportRigLoop">
            {{ exporting ? `Rendering ${Math.round(exportProgress * 100)}%` : `Export modular ${exportFormat.toUpperCase()}` }}
          </button>
          <div v-if="exporting" class="sequence-export__progress" aria-hidden="true">
            <span :style="{ width: `${Math.round(exportProgress * 100)}%` }" />
          </div>
          <p>{{ exportStatus || 'Uses the same rig state, easing, hold timing and SVG renderer as the preview. Hair becomes compositable in the next architecture milestone.' }}</p>
        </div>
      </div>

      <div class="sequence-editor">
        <div class="sequence-editor__title">
          <strong>Sequence</strong>
          <span>Drag to reorder · 2–6 expressions</span>
        </div>
        <div class="sequence-steps">
          <article
            v-for="(expression, index) in order"
            :key="expression"
            class="sequence-step"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop="onDrop(index)"
          >
            <div class="sequence-step__head">
              <span class="sequence-step__index">{{ index + 1 }}</span>
              <strong>{{ labelFor(expression) }}</strong>
              <div>
                <button type="button" :disabled="index === 0" aria-label="Move left" @click="move(index, -1)">←</button>
                <button type="button" :disabled="index === order.length - 1" aria-label="Move right" @click="move(index, 1)">→</button>
              </div>
            </div>
            <label>
              <span>Hold <em>{{ holds[expression] }}ms</em></span>
              <input v-model.number="holds[expression]" type="range" min="80" max="1600" step="20" />
            </label>
          </article>
        </div>

        <div class="sequence-settings">
          <label>
            <span>Transition <em>{{ transitionMs }}ms</em></span>
            <input v-model.number="transitionMs" type="range" min="100" max="1200" step="20" />
          </label>
          <label>
            <span>Easing</span>
            <select v-model="easing">
              <option value="linear">Linear</option>
              <option value="ease-in">Ease in</option>
              <option value="ease-out">Ease out</option>
              <option value="ease-in-out">Ease in/out</option>
            </select>
          </label>
          <label>
            <span>Ease strength <em>{{ easeStrength.toFixed(1) }}</em></span>
            <input v-model.number="easeStrength" type="range" min="1" max="4" step="0.1" :disabled="easing === 'linear'" />
          </label>
          <label class="sequence-seamless">
            <input v-model="seamless" type="checkbox" />
            <span><strong>Seamless loop</strong><small>Morph the final expression back into the first.</small></span>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sequence-lab {
  width: min(1180px, calc(100% - 32px));
  margin: 34px auto 20px;
  padding: 24px;
  border: 1px solid rgb(23 21 20 / 0.14);
  border-radius: 28px;
  background: #171514;
  color: #fff;
  box-shadow: 0 28px 80px rgb(34 25 20 / 0.14);
}
.sequence-lab__heading { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; }
.sequence-lab__heading h2 { margin:4px 0 7px; font-size:clamp(26px,3vw,40px); letter-spacing:-.045em; }
.sequence-lab__heading p { max-width:700px; margin:0; color:rgb(255 255 255 / .58); font-size:12px; line-height:1.6; }
.sequence-lab__eyebrow { color:#ff5656; font-size:10px; font-weight:950; letter-spacing:.14em; }
.sequence-lab__duration { flex:none; padding:8px 11px; border:1px solid rgb(255 255 255 / .16); border-radius:999px; color:rgb(255 255 255 / .72); font:850 10px/1 system-ui; }
.sequence-palette { display:flex; flex-wrap:wrap; gap:7px; margin:20px 0; }
.sequence-palette button { min-height:34px; padding:0 11px; border:1px solid rgb(255 255 255 / .13); border-radius:11px; background:#24211f; color:#d9d2cb; cursor:pointer; font:800 10px/1 system-ui; }
.sequence-palette button span { display:inline-grid; place-items:center; width:18px; height:18px; margin-right:5px; border-radius:50%; background:rgb(255 255 255 / .08); }
.sequence-palette button.is-selected { background:#fff; color:#171514; border-color:#fff; }
.sequence-palette button.is-selected span { background:#d93333; color:#fff; }
.sequence-layout { display:grid; grid-template-columns:minmax(300px,.9fr) minmax(420px,1.2fr); gap:18px; }
.sequence-preview, .sequence-editor { border:1px solid rgb(255 255 255 / .1); border-radius:22px; background:#201d1b; }
.sequence-preview { padding:16px; }
.sequence-preview__stage { overflow:hidden; border-radius:18px; background:linear-gradient(145deg,#edf4f6,#f5ece7); }
.sequence-preview__stage :deep(svg) { display:block; width:100%; aspect-ratio:1; }
.sequence-preview__meta { display:flex; justify-content:space-between; gap:10px; padding:12px 2px 4px; font-size:10px; }
.sequence-preview__meta strong { text-transform:capitalize; }
.sequence-preview__meta span { color:rgb(255 255 255 / .48); }
.sequence-transport { display:grid; grid-template-columns:auto auto 1fr auto; gap:8px; align-items:center; margin-top:10px; }
.sequence-transport button { min-height:34px; padding:0 10px; border:1px solid rgb(255 255 255 / .14); border-radius:10px; background:#2a2623; color:#fff; cursor:pointer; font:850 9px/1 system-ui; }
.sequence-transport input { width:100%; accent-color:#ff4c4c; }
.sequence-transport span { color:rgb(255 255 255 / .55); font:750 9px/1 system-ui; }
.sequence-export { margin-top:14px; padding:13px; border:1px solid rgb(255 255 255 / .1); border-radius:16px; background:#292522; }
.sequence-export__head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px; }
.sequence-export__head div { display:grid; gap:3px; }
.sequence-export__head div span { color:#ff6565; font-size:8px; font-weight:950; letter-spacing:.12em; }
.sequence-export__head div strong { font-size:11px; }
.sequence-export__head > span { padding:5px 7px; border-radius:999px; background:rgb(255 255 255 / .07); color:rgb(255 255 255 / .46); font:850 7px/1 system-ui; letter-spacing:.08em; }
.sequence-export__controls { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; }
.sequence-export__controls label { display:grid; gap:4px; color:rgb(255 255 255 / .44); font-size:8px; font-weight:850; }
.sequence-export__controls select { min-width:0; height:31px; padding:0 7px; border:1px solid rgb(255 255 255 / .11); border-radius:8px; background:#211e1c; color:#fff; font-size:9px; }
.sequence-export__controls select:disabled { opacity:.4; }
.sequence-export__button { width:100%; min-height:36px; margin-top:9px; border:0; border-radius:10px; background:#fff; color:#171514; cursor:pointer; font:950 9px/1 system-ui; }
.sequence-export__button:disabled { opacity:.62; cursor:wait; }
.sequence-export__progress { height:4px; margin-top:8px; overflow:hidden; border-radius:999px; background:rgb(255 255 255 / .08); }
.sequence-export__progress span { display:block; height:100%; border-radius:inherit; background:#ff5656; transition:width 100ms linear; }
.sequence-export p { margin:8px 1px 0; color:rgb(255 255 255 / .4); font-size:8.5px; line-height:1.45; }
.sequence-editor { padding:16px; }
.sequence-editor__title { display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; }
.sequence-editor__title strong { font-size:13px; }
.sequence-editor__title span { color:rgb(255 255 255 / .42); font-size:9px; }
.sequence-steps { display:grid; gap:8px; }
.sequence-step { padding:10px 11px; border:1px solid rgb(255 255 255 / .09); border-radius:14px; background:#272320; cursor:grab; }
.sequence-step__head { display:grid; grid-template-columns:auto 1fr auto; gap:8px; align-items:center; margin-bottom:8px; }
.sequence-step__index { display:grid; place-items:center; width:22px; height:22px; border-radius:50%; background:#d93333; font:900 9px/1 system-ui; }
.sequence-step__head strong { font-size:10px; }
.sequence-step__head button { width:26px; height:25px; margin-left:4px; border:1px solid rgb(255 255 255 / .1); border-radius:8px; background:#332e2b; color:#fff; cursor:pointer; }
.sequence-step__head button:disabled { opacity:.25; cursor:default; }
.sequence-step label, .sequence-settings > label:not(.sequence-seamless) { display:grid; gap:5px; }
.sequence-step label span, .sequence-settings label > span { display:flex; justify-content:space-between; color:rgb(255 255 255 / .52); font-size:9px; }
.sequence-step em, .sequence-settings em { color:#fff; font-style:normal; }
.sequence-step input, .sequence-settings input[type='range'] { width:100%; accent-color:#ff4c4c; }
.sequence-settings { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px; padding-top:14px; border-top:1px solid rgb(255 255 255 / .08); }
.sequence-settings select { height:34px; padding:0 9px; border:1px solid rgb(255 255 255 / .12); border-radius:9px; background:#2b2724; color:#fff; }
.sequence-seamless { grid-column:1 / -1; display:flex; gap:9px; align-items:flex-start; padding:10px; border-radius:12px; background:rgb(255 255 255 / .04); }
.sequence-seamless input { margin-top:2px; accent-color:#d93333; }
.sequence-seamless span { display:grid !important; gap:3px; justify-content:start !important; }
.sequence-seamless strong { color:#fff; font-size:10px; }
.sequence-seamless small { color:rgb(255 255 255 / .45); font-size:9px; }
@media (max-width:900px) { .sequence-layout { grid-template-columns:1fr; } }
@media (max-width:560px) {
  .sequence-lab { width:calc(100% - 18px); padding:16px; border-radius:22px; }
  .sequence-lab__heading { display:block; }
  .sequence-lab__duration { display:inline-block; margin-top:12px; }
  .sequence-transport { grid-template-columns:1fr 1fr; }
  .sequence-transport input { grid-column:1 / -1; }
  .sequence-export__controls { grid-template-columns:1fr 1fr; }
  .sequence-settings { grid-template-columns:1fr; }
  .sequence-seamless { grid-column:auto; }
}
</style>
