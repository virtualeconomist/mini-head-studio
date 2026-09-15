<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EXPRESSIONS, type ExpressionId } from '@/stella/catalog'
import {
  expressionSequenceDurationMs,
  type ExpressionSequence,
  type SequenceEasingId
} from '@/stella/expression-sequence'
import {
  createRigSequenceExport,
  rigFrameForSequence,
  STELLA_ACCESSORIES,
  STELLA_MODULAR_HAIRS,
  type AccessoryId,
  type AccessoryPlacement,
  type HairPlacement,
  type ModularHairId,
  type RigSequenceExportBackground,
  type RigSequenceExportFormat
} from '@/stella/rig'

const STORAGE_KEY = 'mini-head-rig-sequencer-v2'
const defaultOrder: ExpressionId[] = ['happy', 'wink', 'cheeky', 'love']
const defaultHolds: Record<ExpressionId, number> = {
  happy: 420, wink: 300, surprised: 360, cheeky: 360, sleepy: 520, love: 460
}
const defaultPlacement = { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }

const validHairIds = new Set<ModularHairId>(['none', ...STELLA_MODULAR_HAIRS.map((item) => item.id)])
const validAccessoryIds = new Set<AccessoryId>(['none', ...STELLA_ACCESSORIES.map((item) => item.id)])
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<{
      order: ExpressionId[]
      holds: Partial<Record<ExpressionId, number>>
      transitionMs: number
      easing: SequenceEasingId
      easeStrength: number
      seamless: boolean
      hairId: ModularHairId
      hairPlacement: Partial<HairPlacement>
      accessoryId: AccessoryId
      accessoryPlacement: Partial<AccessoryPlacement>
    }>
  } catch { return {} }
})()

const validOrder = Array.isArray(saved.order)
  ? saved.order.filter((id): id is ExpressionId => EXPRESSIONS.some((item) => item.id === id)).slice(0, 6)
  : []
const order = ref<ExpressionId[]>(validOrder.length >= 2 ? validOrder : defaultOrder)
const holds = ref<Record<ExpressionId, number>>({ ...defaultHolds, ...(saved.holds ?? {}) })
const transitionMs = ref(Math.max(100, Math.min(1200, saved.transitionMs ?? 420)))
const easing = ref<SequenceEasingId>(['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(saved.easing ?? '') ? saved.easing as SequenceEasingId : 'ease-in-out')
const easeStrength = ref(Math.max(1, Math.min(4, saved.easeStrength ?? 2.4)))
const seamless = ref(saved.seamless !== false)
const hairId = ref<ModularHairId>(validHairIds.has(saved.hairId as ModularHairId) ? saved.hairId as ModularHairId : 'generated-classic-bob')
const hairPlacement = ref<HairPlacement>({ ...defaultPlacement, ...(saved.hairPlacement ?? {}) })
const accessoryId = ref<AccessoryId>(validAccessoryIds.has(saved.accessoryId as AccessoryId) ? saved.accessoryId as AccessoryId : 'none')
const accessoryPlacement = ref<AccessoryPlacement>({ ...defaultPlacement, ...(saved.accessoryPlacement ?? {}) })
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
  steps: order.value.map((expression) => ({ expression, holdMs: Math.max(80, Math.min(1600, holds.value[expression] ?? 420)) })),
  transitionMs: transitionMs.value,
  easing: easing.value,
  easeStrength: easeStrength.value,
  seamless: seamless.value,
  transitionStyle: 'crossfade'
}))
const durationMs = computed(() => expressionSequenceDurationMs(sequence.value))
const renderedFrame = computed(() => rigFrameForSequence(sequence.value, playheadMs.value, {
  hairId: hairId.value,
  hairPlacement: hairPlacement.value,
  accessoryId: accessoryId.value,
  accessoryPlacement: accessoryPlacement.value
}))
const renderedSvg = computed(() => renderedFrame.value.svg)
const sample = computed(() => renderedFrame.value.sample)
const durationLabel = computed(() => `${(durationMs.value / 1000).toFixed(2)}s loop`)
const statusLabel = computed(() => sample.value.inTransition
  ? `${sample.value.from} → ${sample.value.to} · ${Math.round(sample.value.easedProgress * 100)}%`
  : `${sample.value.from} · hold`)
const selectedHair = computed(() => STELLA_MODULAR_HAIRS.find((item) => item.id === hairId.value))
const selectedAccessory = computed(() => STELLA_ACCESSORIES.find((item) => item.id === accessoryId.value))
const hairLabel = computed(() => hairId.value === 'none' ? 'Face only' : selectedHair.value?.label ?? hairId.value)
const accessoryLabel = computed(() => accessoryId.value === 'none' ? 'No accessory' : selectedAccessory.value?.label ?? accessoryId.value)

watch([order, holds, transitionMs, easing, easeStrength, seamless, hairId, hairPlacement, accessoryId, accessoryPlacement], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: order.value, holds: holds.value, transitionMs: transitionMs.value, easing: easing.value, easeStrength: easeStrength.value, seamless: seamless.value, hairId: hairId.value, hairPlacement: hairPlacement.value, accessoryId: accessoryId.value, accessoryPlacement: accessoryPlacement.value }))
  if (playheadMs.value >= durationMs.value) playheadMs.value = 0
}, { deep: true })

function tick(now: number) {
  if (!playing.value) return
  if (!lastFrameAt) lastFrameAt = now
  playheadMs.value = (playheadMs.value + now - lastFrameAt) % Math.max(1, durationMs.value)
  lastFrameAt = now
  frame = requestAnimationFrame(tick)
}
function togglePlayback() { playing.value = !playing.value; cancelAnimationFrame(frame); lastFrameAt = 0; if (playing.value) frame = requestAnimationFrame(tick) }
function restart() { playheadMs.value = 0; lastFrameAt = 0 }
function toggleExpression(expression: ExpressionId) {
  const index = order.value.indexOf(expression)
  if (index >= 0) { if (order.value.length <= 2) return; order.value.splice(index, 1) }
  else if (order.value.length < 6) order.value.push(expression)
  restart()
}
function move(index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= order.value.length) return
  const next = [...order.value]; const [item] = next.splice(index, 1); next.splice(nextIndex, 0, item!); order.value = next; restart()
}
function onDrop(index: number) { if (dragIndex < 0 || dragIndex === index) return; const next = [...order.value]; const [item] = next.splice(dragIndex, 1); next.splice(index, 0, item!); order.value = next; dragIndex = -1; restart() }
function labelFor(expression: ExpressionId) { return EXPRESSIONS.find((item) => item.id === expression)?.label ?? expression }
function resetHairFit() { hairPlacement.value = { ...defaultPlacement } }
function resetAccessoryFit() { accessoryPlacement.value = { ...defaultPlacement } }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
async function exportRigLoop() {
  if (exporting.value) return
  const resume = playing.value
  if (resume) { playing.value = false; cancelAnimationFrame(frame) }
  exporting.value = true; exportProgress.value = 0; exportStatus.value = 'Rendering layered character frames…'
  try {
    const blob = await createRigSequenceExport({
      sequence: sequence.value, format: exportFormat.value, size: exportSize.value, fps: exportFps.value, quality: 'high',
      background: exportFormat.value === 'gif' ? exportBackground.value : 'studio',
      hairId: hairId.value, hairPlacement: hairPlacement.value, accessoryId: accessoryId.value, accessoryPlacement: accessoryPlacement.value,
      onProgress: (progress) => { exportProgress.value = progress }
    })
    downloadBlob(blob, `stella-${hairId.value}-${accessoryId.value}-loop.${exportFormat.value}`)
    exportStatus.value = `${exportFormat.value.toUpperCase()} exported from the same layered renderer as preview.`
  } catch (error) { exportStatus.value = error instanceof Error ? error.message : 'Rig export failed' }
  finally { exporting.value = false; if (resume) { playing.value = true; lastFrameAt = 0; frame = requestAnimationFrame(tick) } }
}
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <section class="sequence-lab" aria-label="Multi-expression rig sequencer">
    <div class="heading"><div><span>MODULAR RIG · ASSET PACK</span><h2>Expression Sequencer</h2><p>Parametric expressions now composite with interchangeable generated hair and accessory layers. The earlier source-mask Plush Bob remains available as a legacy experiment.</p></div><em>{{ durationLabel }}</em></div>

    <div class="asset-builder">
      <div class="asset-card">
        <div class="asset-card__top"><div><span>HAIR</span><strong>{{ hairLabel }}</strong></div><label><select v-model="hairId"><option value="none">None · face only</option><option v-for="hair in STELLA_MODULAR_HAIRS" :key="hair.id" :value="hair.id">{{ hair.label }}</option></select></label><button :disabled="hairId === 'none'" @click="resetHairFit">Reset fit</button></div>
        <div v-if="hairId !== 'none'" class="fit"><label><span>X <em>{{ hairPlacement.offsetX }}</em></span><input v-model.number="hairPlacement.offsetX" type="range" min="-56" max="56" /></label><label><span>Y <em>{{ hairPlacement.offsetY }}</em></span><input v-model.number="hairPlacement.offsetY" type="range" min="-56" max="56" /></label><label><span>Scale <em>{{ hairPlacement.scale.toFixed(2) }}</em></span><input v-model.number="hairPlacement.scale" type="range" min="0.72" max="1.28" step="0.01" /></label><label><span>Rotate <em>{{ hairPlacement.rotation }}°</em></span><input v-model.number="hairPlacement.rotation" type="range" min="-12" max="12" step="0.5" /></label></div>
        <p>{{ selectedHair?.description || 'Render the generated base head and face rig without a hair overlay.' }}</p>
      </div>
      <div class="asset-card">
        <div class="asset-card__top"><div><span>ACCESSORY</span><strong>{{ accessoryLabel }}</strong></div><label><select v-model="accessoryId"><option value="none">None</option><option v-for="item in STELLA_ACCESSORIES" :key="item.id" :value="item.id">{{ item.label }}</option></select></label><button :disabled="accessoryId === 'none'" @click="resetAccessoryFit">Reset fit</button></div>
        <div v-if="accessoryId !== 'none'" class="fit"><label><span>X <em>{{ accessoryPlacement.offsetX }}</em></span><input v-model.number="accessoryPlacement.offsetX" type="range" min="-56" max="56" /></label><label><span>Y <em>{{ accessoryPlacement.offsetY }}</em></span><input v-model.number="accessoryPlacement.offsetY" type="range" min="-56" max="56" /></label><label><span>Scale <em>{{ accessoryPlacement.scale.toFixed(2) }}</em></span><input v-model.number="accessoryPlacement.scale" type="range" min="0.72" max="1.28" step="0.01" /></label><label><span>Rotate <em>{{ accessoryPlacement.rotation }}°</em></span><input v-model.number="accessoryPlacement.rotation" type="range" min="-12" max="12" step="0.5" /></label></div>
        <p>{{ selectedAccessory?.description || 'No accessory overlay.' }}</p>
      </div>
    </div>

    <div class="palette"><button v-for="item in EXPRESSIONS" :key="item.id" :class="{ selected: order.includes(item.id) }" @click="toggleExpression(item.id)"><span>{{ order.indexOf(item.id) >= 0 ? order.indexOf(item.id) + 1 : '+' }}</span>{{ item.label }}</button></div>

    <div class="layout">
      <div class="preview-panel">
        <div class="stage" v-html="renderedSvg" />
        <div class="meta"><strong>{{ statusLabel }}</strong><span>{{ hairLabel }} · {{ accessoryLabel }}</span></div>
        <div class="transport"><button @click="togglePlayback">{{ playing ? '‰ Pause' : '₹ Play loop' }}</button><button @click="restart">↻ Restart</button><input v-model.number="playheadMs" type="range" min="0" :max="Math.max(1, durationMs)" step="1" /><span>{{ (playheadMs / 1000).toFixed(2) }}s</span></div>
        <div class="export-card"><div class="export-head"><div><span>DIRECT MODULAR EXPORT</span><strong>Export this exact layered character loop</strong></div><em>HAIR + FACE + ACCESSORY</em></div><div class="export-controls"><label><span>Format</span><select v-model="exportFormat"><option value="gif">GIF</option><option value="mp4">MP4</option><option value="webm">WebM</option></select></label><label><span>Size</span><select v-model.number="exportSize"><option :value="320">320</option><option :value="512">512</option><option :value="1024">1024</option></select></label><label><span>FPS</span><select v-model.number="exportFps"><option :value="10">10</option><option :value="15">15</option><option :value="20">20</option><option :value="24">24</option><option :value="30">30</option></select></label><label><span>Background</span><select v-model="exportBackground" :disabled="exportFormat !== 'gif'"><option value="studio">Studio</option><option value="transparent">Transparent</option></select></label></div><button class="export-button" :disabled="exporting" @click="exportRigLoop">{{ exporting ? `Rendering ${Math.round(exportProgress * 100)}%` : `Export ${exportFormat.toUpperCase()}` }}</button><div v-if="exporting" class="progress" aria-hidden="true"><span :style="{ width: `${Math.round(exportProgress * 100)}%` }" /></div><p>{{ exportStatus || 'Preview and export share the same base head, face rig, hair, accessory, fit and timing.' }}</p></div>
      </div>

      <div class="editor"><div class="editor-title"><strong>Sequence</strong><span>Drag to reorder · 26 expressions</span></div><div class="steps"><article v-for="(expression,index) in order" :key="expression" draggable="true" @dragstart="dragIndex=index" @dragover.prevent @drop="onDrop(index)"><div class="step-head"><span>{{ index+1 }}</span><strong>{{ labelFor(expression) }}</strong><div><button :disabled="index===0" @click="move(index,-1)">←</button><button :disabled="index===order.length-1" @click="move(index,1)">→</button></div></div><label><span>Hold <em>{{ holds[expression] }}ms</em></span><input v-model.number="holds[expression]" type="range" min="80" max="1600" step="20" /></label></article></div><div class="settings"><label><span>Transition <em>{{ transitionMs }}ms</em></span><input v-model.number="transitionMs" type="range" min="100" max="1200" step="20" /></label><label><span>Easing</span><select v-model="easing"><option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in/out</option></select></label><label><span>Ease strength <em>{{ easeStrength.toFixed(1) }}</em></span><input v-model.number="easeStrength" type="range" min="1" max="4" step="0.1" :disabled="easing==='linear'" /></label><label class="seamless"><input v-model="seamless" type="checkbox" /><span><strong>Seamless loop</strong><small>Morph final expression back into first.</small></span></label></div></div>
    </div>
  </section>
</template>

<style scoped>
.sequence-lab{width:min(1180px,calc(100% - 32px));margin:34px auto 20px;padding:24px;border:1px solid rgb(23 21 20/.14);border-radius:28px;background:#171514;color:#fff;box-shadow:0 28px 80px rgb(34 25 20/.14)}.heading{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.heading>div>span,.asset-card__top>div>span,.export-head div span{color:#ff5656;font-size:9px;font-weight:950;letter-spacing:.13em}.heading h2{margin:4px 0 7px;font-size:clamp(26px,3vw,40px);letter-spacing:-.045em}.heading p{max-width:760px;margin:0;color:rgb(255 255 255/.58);font-size:12px;line-height:1.6}.heading>em,.export-head>em{flex:none;padding:8px 11px;border:1px solid rgb(255 255 255/.16);border-radius:999px;color:rgb(255 255 255/.72);font:850 9px/1 system-ui;font-style:normal}.asset-builder{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}.asset-card{padding:13px;border:1px solid rgb(255 255 255/.1);border-radius:16px;background:#24211f}.asset-card__top{display:grid;grid-template-columns:1fr 200px auto;gap:10px;align-items:end}.asset-card__top>div{display:grid;gap:3px}.asset-card__top strong{font-size:11px}.asset-card select,.settings select,.export-controls select{height:32px;padding:0 8px;border:1px solid rgb(255 255 255/.12);border-radius:9px;background:#1d1a19;color:#fff}.asset-card__top button,.transport button,.step-head button{height:32px;padding:0 10px;border:1px solid rgb(255 255 255/.12);border-radius:9px;background:#302b28;color:#fff;font:850 8px/1 system-ui}.asset-card__top button:disabled{opacity:.35}.fit{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid rgb(255 255 255/.07)}.fit label,.settings>label,.steps article>label{display:grid;gap:5px}.fit span,.settings label>span,.steps article>label>span{display:flex;justify-content:space-between;color:rgb(255 255 255/.48);font-size:8px}.fit em,.settings em,.steps em{color:#fff;font-style:normal}.fit input,.settings input,.steps input,.transport input{width:100%;accent-color:#ff5656}.asset-card>p,.export-card p{margin:9px 0 0;color:rgb(255 255 255/.4);font-size:8.5px;line-height:1.45}.palette{display:flex;flex-wrap:wrap;gap:7px;margin:18px 0}.palette button{min-height:34px;padding:0 11px;border:1px solid rgb(255 255 255/.13);border-radius:11px;background:#24211f;color:#d9d2cb;font:800 10px/1 system-ui}.palette button span{display:inline-grid;place-items:center;width:18px;height:18px;margin-right:5px;border-radius:50%;background:rgb(255 255 255/.08)}.palette button.selected{background:#fff;color:#171514}.palette button.selected span{background:#d93333;color:#fff}.layout{display:grid;grid-template-columns:minmax(300px,.9fr) minmax(420px,1.2fr);gap:18px}.preview-panel,.editor{border:1px solid rgb(255 255 255/.1);border-radius:22px;background:#201d1b}.preview-panel,.editor{padding:16px}.stage{overflow:hidden;border-radius:18px;background:linear-gradient(145deg,#edf4f6,#f5ece7)}.stage :deep(svg){display:block;width:100%;aspect-ratio:1}.meta{display:flex;justify-content:space-between;gap:10px;padding:12px 2px 4px;font-size:10px}.meta strong{text-transform:capitalize}.meta span{color:rgb(255 255 255/.48)}.transport{display:grid;grid-template-columns:auto auto 1fr auto;gap:8px;align-items:center;margin-top:10px}.transport span{color:rgb(255 255 255/.55);font-size:9px}.export-card{margin-top:14px;padding:13px;border:1px solid rgb(255 255 255/.1);border-radius:16px;background:#292522}.export-head{display:flex;justify-content:space-between;gap:10px}.export-head div{display:grid;gap:3px}.export-head strong{font-size:11px}.export-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.export-controls label{display:grid;gap:4px;color:rgb(255 255 255/.44);font-size:8px}.export-button{width:100%;min-height:36px;margin-top:9px;border:0;border-radius:10px;background:#fff;color:#171514;font:950 9px/1 system-ui}.progress{height:4px;margin-top:8px;border-radius:99px;background:rgb(255 255 255/.08);overflow:hidden}.progress span{display:block;height:100%;background:#ff5656}.editor-title{display:flex;justify-content:space-between;margin-bottom:10px}.editor-title span{color:rgb(255 255 255/.42);font-size:9px}.steps{display:grid;gap:8px}.steps article{padding:10px 11px;border:1px solid rgb(255 255 255/.09);border-radius:14px;background:#272320;cursor:grab}.step-head{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-bottom:8px}.step-head>span{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#d93333;font-size:9px}.step-head strong{font-size:10px}.settings{display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid rgb(255 255 255/.08)}.seamless{grid-column:1/-1;display:flex!important;align-items:center;gap:9px;padding:10px;border-radius:12px;background:rgb(255 255 255/.04)}.seamless input{width:auto}.seamless span{display:grid!important;justify-content:start!important;gap:2px}.seamless small{color:rgb(255 255 255/.42)}@media(max-width:900px){.asset-builder,.layout{grid-template-columns:1fr}}@media(max-width:600px){.sequence-lab{width:calc(100% - 16px);padding:14px}.asset-card__top{display:grid;grid-template-columns:1fr}.fit,.export-controls,.settings{grid-template-columns:1fr 1fr}}
</style>
