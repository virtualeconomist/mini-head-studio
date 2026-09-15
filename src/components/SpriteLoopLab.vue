<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EXPRESSIONS, type ExpressionId } from '@/stella/catalog'
import {
  expressionSequenceDurationMs,
  type ExpressionSequence,
  type SequenceEasingId,
  type SequenceTransitionStyle
} from '@/stella/expression-sequence'
import { SPRITE_ASSET_PACKS, spriteAssetPack } from '@/stella/sprite/stella-pack'
import { createSpriteSequenceRenderer } from '@/stella/sprite/sequence-renderer'
import type { SpriteAssetPack } from '@/stella/sprite/manifest'

const STORAGE_KEY = 'mini-head-sprite-sequencer'
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
      packId: string
      variantId: string
      order: ExpressionId[]
      holds: Partial<Record<ExpressionId, number>>
      transitionMs: number
      transitionStyle: SequenceTransitionStyle
      easing: SequenceEasingId
      easeStrength: number
      seamless: boolean
    }>
  } catch {
    return {}
  }
})()

const packId = ref(saved.packId ?? SPRITE_ASSET_PACKS[0]!.id)
const basePack = computed(() => spriteAssetPack(packId.value))
const variantId = ref(saved.variantId ?? basePack.value.defaultVariantId)
const validOrder = Array.isArray(saved.order)
  ? saved.order.filter((id): id is ExpressionId => EXPRESSIONS.some((item) => item.id === id)).slice(0, 6)
  : []
const order = ref<ExpressionId[]>(validOrder.length >= 2 ? validOrder : [...basePack.value.defaultSequence])
const holds = ref<Record<ExpressionId, number>>({ ...defaultHolds, ...(saved.holds ?? {}) })
const transitionMs = ref(typeof saved.transitionMs === 'number' ? Math.max(80, Math.min(1200, saved.transitionMs)) : 280)
const transitionStyle = ref<SequenceTransitionStyle>(
  ['crossfade', 'pop', 'blink', 'snap'].includes(saved.transitionStyle ?? '')
    ? saved.transitionStyle as SequenceTransitionStyle
    : 'crossfade'
)
const easing = ref<SequenceEasingId>(
  ['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(saved.easing ?? '')
    ? saved.easing as SequenceEasingId
    : 'ease-in-out'
)
const easeStrength = ref(typeof saved.easeStrength === 'number' ? Math.max(1, Math.min(4, saved.easeStrength)) : 2.2)
const seamless = ref(saved.seamless !== false)
const playing = ref(false)
const playheadMs = ref(0)
const overrides = ref<Partial<Record<ExpressionId, string>>>({})
let raf = 0
let lastFrameAt = 0

const activePack = computed<SpriteAssetPack>(() => ({
  ...basePack.value,
  variants: basePack.value.variants.map((variant) => variant.id === variantId.value
    ? { ...variant, assets: { ...variant.assets, ...overrides.value } }
    : variant)
}))

const sequence = computed<ExpressionSequence>(() => ({
  steps: order.value.map((expression) => ({
    expression,
    holdMs: Math.max(80, Math.min(1600, holds.value[expression] ?? 420))
  })),
  transitionMs: transitionMs.value,
  easing: easing.value,
  easeStrength: easeStrength.value,
  seamless: seamless.value,
  transitionStyle: transitionStyle.value
}))
const durationMs = computed(() => expressionSequenceDurationMs(sequence.value))
const renderer = computed(() => createSpriteSequenceRenderer(activePack.value, variantId.value))
const renderedFrame = computed(() => renderer.value.frameAt(sequence.value, playheadMs.value))
const statusLabel = computed(() => renderedFrame.value.inTransition
  ? `${renderedFrame.value.sample.from} → ${renderedFrame.value.sample.to} · ${Math.round(renderedFrame.value.progress * 100)}%`
  : `${renderedFrame.value.sample.from} · hold`
)
const overrideCount = computed(() => Object.keys(overrides.value).length)

watch(packId, () => {
  variantId.value = basePack.value.defaultVariantId
  clearOverrides()
})
watch(variantId, clearOverrides)
watch([packId, variantId, order, holds, transitionMs, transitionStyle, easing, easeStrength, seamless], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    packId: packId.value,
    variantId: variantId.value,
    order: order.value,
    holds: holds.value,
    transitionMs: transitionMs.value,
    transitionStyle: transitionStyle.value,
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
  playheadMs.value = (playheadMs.value + delta) % Math.max(1, durationMs.value)
  raf = requestAnimationFrame(tick)
}

function togglePlayback() {
  playing.value = !playing.value
  cancelAnimationFrame(raf)
  lastFrameAt = 0
  if (playing.value) raf = requestAnimationFrame(tick)
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
  const target = index + direction
  if (target < 0 || target >= order.value.length) return
  const next = [...order.value]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  order.value = next
  restart()
}

function labelFor(expression: ExpressionId) {
  return EXPRESSIONS.find((item) => item.id === expression)?.label ?? expression
}

function setOverride(expression: ExpressionId, event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const old = overrides.value[expression]
  if (old?.startsWith('blob:')) URL.revokeObjectURL(old)
  overrides.value = { ...overrides.value, [expression]: URL.createObjectURL(file) }
  input.value = ''
}

function removeOverride(expression: ExpressionId) {
  const old = overrides.value[expression]
  if (old?.startsWith('blob:')) URL.revokeObjectURL(old)
  const next = { ...overrides.value }
  delete next[expression]
  overrides.value = next
}

function clearOverrides() {
  Object.values(overrides.value).forEach((url) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  })
  overrides.value = {}
}

function imageStyle(incoming: boolean) {
  const frame = renderedFrame.value
  if (!frame.inTransition) return incoming
    ? { opacity: '0', transform: 'none', filter: 'none' }
    : { opacity: '1', transform: 'none', filter: 'none' }

  const p = frame.progress
  const alpha = incoming ? p : 1 - p
  if (frame.transitionStyle === 'pop') {
    const scale = incoming ? 0.82 + p * 0.18 : 1 + p * 0.025
    const rotate = incoming ? -2 * (1 - p) : 1.5 * p
    return { opacity: String(alpha), transform: `scale(${scale}) rotate(${rotate}deg)`, filter: 'none' }
  }
  if (frame.transitionStyle === 'blink') {
    const scaleY = incoming ? 0.08 + p * 0.92 : Math.max(0.08, 1 - p * 0.92)
    return { opacity: String(alpha), transform: `scaleY(${scaleY})`, filter: `blur(${1.5 * (incoming ? 1 - p : p)}px)` }
  }
  if (frame.transitionStyle === 'snap') {
    const scale = incoming ? 1.07 - p * 0.07 : 1 - p * 0.025
    const y = incoming ? 5 * (1 - p) : -1.8 * p
    return { opacity: String(alpha), transform: `translateY(${y}%) scale(${scale})`, filter: `blur(${incoming ? 7 * (1 - p) : 3 * p}px)` }
  }
  return { opacity: String(alpha), transform: 'none', filter: 'none' }
}

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearOverrides()
})
</script>

<template>
  <section class="sprite-lab" aria-label="Sprite Loop renderer playground">
    <header class="sprite-lab__heading">
      <div>
        <span>ASSET MODE · SUBSTITUTABLE RENDERER</span>
        <h2>Sprite Loop</h2>
        <p>The current raster workflow is now a first-class renderer. Swap packs, variants or temporary expression assets without changing the timeline engine.</p>
      </div>
      <span>{{ (durationMs / 1000).toFixed(2) }}s loop</span>
    </header>

    <div class="sprite-lab__selectors">
      <label>
        <span>Asset pack</span>
        <select v-model="packId">
          <option v-for="pack in SPRITE_ASSET_PACKS" :key="pack.id" :value="pack.id">{{ pack.label }}</option>
        </select>
      </label>
      <label>
        <span>Variant</span>
        <select v-model="variantId">
          <option v-for="variant in basePack.variants" :key="variant.id" :value="variant.id">{{ variant.label }}</option>
        </select>
      </label>
      <div class="sprite-lab__pack-note">
        <strong>{{ basePack.description }}</strong>
        <span>{{ basePack.variants.length }} variants · {{ EXPRESSIONS.length }} expression slots · manifest v{{ basePack.version }}</span>
      </div>
    </div>

    <div class="sprite-lab__layout">
      <div class="sprite-preview">
        <div class="sprite-preview__stage">
          <img :src="renderedFrame.fromSource" alt="" :style="imageStyle(false)" />
          <img :src="renderedFrame.toSource" alt="" :style="imageStyle(true)" />
        </div>
        <div class="sprite-preview__meta">
          <strong>{{ statusLabel }}</strong>
          <span>{{ transitionStyle }} · {{ easing }}</span>
        </div>
        <div class="sprite-preview__transport">
          <button type="button" @click="togglePlayback">{{ playing ? 'Ⅱ Pause' : '▶ Play loop' }}</button>
          <button type="button" @click="restart">↻ Restart</button>
          <input v-model.number="playheadMs" type="range" min="0" :max="Math.max(1, durationMs)" step="1" />
          <span>{{ (playheadMs / 1000).toFixed(2) }}s</span>
        </div>
      </div>

      <div class="sprite-editor">
        <div class="sprite-palette">
          <button
            v-for="item in EXPRESSIONS"
            :key="item.id"
            type="button"
            :class="{ selected: order.includes(item.id) }"
            @click="toggleExpression(item.id)"
          >
            <span>{{ order.indexOf(item.id) >= 0 ? order.indexOf(item.id) + 1 : '+' }}</span>
            {{ item.label }}
          </button>
        </div>

        <div class="sprite-steps">
          <article v-for="(expression, index) in order" :key="expression">
            <div>
              <span>{{ index + 1 }}</span>
              <strong>{{ labelFor(expression) }}</strong>
              <button type="button" :disabled="index === 0" @click="move(index, -1)">←</button>
              <button type="button" :disabled="index === order.length - 1" @click="move(index, 1)">→</button>
            </div>
            <label>
              <span>Hold {{ holds[expression] }}ms</span>
              <input v-model.number="holds[expression]" type="range" min="80" max="1600" step="20" />
            </label>
          </article>
        </div>

        <div class="sprite-settings">
          <label><span>Transition</span><select v-model="transitionStyle"><option value="crossfade">Crossfade</option><option value="pop">Pop</option><option value="blink">Blink</option><option value="snap">Snap</option></select></label>
          <label><span>Duration {{ transitionMs }}ms</span><input v-model.number="transitionMs" type="range" min="80" max="1200" step="20" /></label>
          <label><span>Easing</span><select v-model="easing"><option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in/out</option></select></label>
          <label><span>Strength {{ easeStrength.toFixed(1) }}</span><input v-model.number="easeStrength" type="range" min="1" max="4" step="0.1" :disabled="easing === 'linear'" /></label>
          <label class="sprite-seamless"><input v-model="seamless" type="checkbox" /><span><strong>Seamless loop</strong><small>Return the final asset to the opening asset.</small></span></label>
        </div>
      </div>
    </div>

    <div class="sprite-overrides">
      <div class="sprite-overrides__head">
        <div><span>PROTOTYPE ASSET OVERRIDES</span><strong>Substitute individual frames for this session</strong></div>
        <button v-if="overrideCount" type="button" @click="clearOverrides">Reset {{ overrideCount }} override{{ overrideCount === 1 ? '' : 's' }}</button>
      </div>
      <div class="sprite-overrides__grid">
        <label v-for="item in EXPRESSIONS" :key="item.id" :class="{ active: overrides[item.id] }">
          <img :src="overrides[item.id] || activePack.variants.find(v => v.id === variantId)?.assets[item.id]" alt="" />
          <span>{{ item.label }}</span>
          <input type="file" accept="image/*" @change="setOverride(item.id, $event)" />
          <em>{{ overrides[item.id] ? 'Custom · replace' : 'Choose image' }}</em>
          <button v-if="overrides[item.id]" type="button" @click.prevent="removeOverride(item.id)">×</button>
        </label>
      </div>
      <p>Overrides use local object URLs only. Nothing is uploaded or committed; add permanent content packs through the SpriteAssetPack manifest registry.</p>
    </div>
  </section>
</template>

<style scoped>
.sprite-lab{width:min(1180px,calc(100% - 32px));margin:34px auto 20px;padding:24px;border:1px solid rgb(23 21 20/.14);border-radius:28px;background:#171514;color:#fff;box-shadow:0 28px 80px rgb(34 25 20/.14)}
.sprite-lab__heading{display:flex;justify-content:space-between;gap:24px}.sprite-lab__heading>div>span,.sprite-overrides__head div span{color:#ff6565;font:950 9px/1 system-ui;letter-spacing:.13em}.sprite-lab__heading h2{margin:5px 0 7px;font-size:clamp(27px,3vw,40px);letter-spacing:-.045em}.sprite-lab__heading p{max-width:720px;margin:0;color:rgb(255 255 255/.58);font-size:12px;line-height:1.55}.sprite-lab__heading>span{height:max-content;padding:8px 11px;border:1px solid rgb(255 255 255/.15);border-radius:999px;color:rgb(255 255 255/.66);font:850 10px/1 system-ui}
.sprite-lab__selectors{display:grid;grid-template-columns:180px 180px 1fr;gap:10px;margin:20px 0}.sprite-lab__selectors label{display:grid;gap:5px;color:rgb(255 255 255/.5);font-size:9px}.sprite-lab select{height:36px;padding:0 9px;border:1px solid rgb(255 255 255/.12);border-radius:10px;background:#292522;color:#fff}.sprite-lab__pack-note{display:grid;gap:4px;align-content:center;padding:9px 12px;border:1px solid rgb(255 255 255/.08);border-radius:12px;background:#211e1c}.sprite-lab__pack-note strong{font-size:10px}.sprite-lab__pack-note span{color:rgb(255 255 255/.4);font-size:8px}
.sprite-lab__layout{display:grid;grid-template-columns:minmax(300px,.85fr) minmax(440px,1.2fr);gap:18px}.sprite-preview,.sprite-editor{border:1px solid rgb(255 255 255/.1);border-radius:22px;background:#201d1b}.sprite-preview{padding:16px}.sprite-preview__stage{position:relative;overflow:hidden;aspect-ratio:1;border-radius:18px;background:linear-gradient(145deg,#edf4f6,#f5ece7)}.sprite-preview__stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;will-change:opacity,transform,filter}.sprite-preview__meta{display:flex;justify-content:space-between;gap:10px;padding:12px 2px 4px;font-size:10px;text-transform:capitalize}.sprite-preview__meta span{color:rgb(255 255 255/.45)}.sprite-preview__transport{display:grid;grid-template-columns:auto auto 1fr auto;gap:8px;align-items:center;margin-top:9px}.sprite-preview__transport button{min-height:34px;padding:0 10px;border:1px solid rgb(255 255 255/.13);border-radius:10px;background:#2a2623;color:#fff;font:850 9px/1 system-ui}.sprite-preview__transport input{width:100%;accent-color:#ff5656}.sprite-preview__transport span{color:rgb(255 255 255/.5);font-size:9px}
.sprite-editor{padding:16px}.sprite-palette{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px}.sprite-palette button{min-height:33px;padding:0 10px;border:1px solid rgb(255 255 255/.12);border-radius:10px;background:#292522;color:#d7d0ca;font:850 9px/1 system-ui}.sprite-palette button span{display:inline-grid;place-items:center;width:18px;height:18px;margin-right:5px;border-radius:50%;background:rgb(255 255 255/.08)}.sprite-palette button.selected{background:#fff;color:#171514}.sprite-palette button.selected span{background:#d93333;color:#fff}.sprite-steps{display:grid;gap:7px}.sprite-steps article{padding:9px 10px;border:1px solid rgb(255 255 255/.08);border-radius:12px;background:#272320}.sprite-steps article>div{display:grid;grid-template-columns:auto 1fr auto auto;gap:6px;align-items:center}.sprite-steps article>div>span{display:grid;place-items:center;width:21px;height:21px;border-radius:50%;background:#d93333;font-size:9px;font-weight:900}.sprite-steps strong{font-size:10px}.sprite-steps button{width:25px;height:24px;border:1px solid rgb(255 255 255/.1);border-radius:7px;background:#332e2b;color:#fff}.sprite-steps button:disabled{opacity:.25}.sprite-steps label{display:grid;gap:4px;margin-top:7px;color:rgb(255 255 255/.48);font-size:8px}.sprite-steps input,.sprite-settings input[type=range]{width:100%;accent-color:#ff5656}.sprite-settings{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px;padding-top:13px;border-top:1px solid rgb(255 255 255/.08)}.sprite-settings>label:not(.sprite-seamless){display:grid;gap:5px;color:rgb(255 255 255/.48);font-size:8px}.sprite-seamless{grid-column:1/-1;display:flex;gap:8px;padding:9px;border-radius:11px;background:rgb(255 255 255/.04)}.sprite-seamless input{accent-color:#d93333}.sprite-seamless span{display:grid;gap:2px}.sprite-seamless strong{font-size:9px}.sprite-seamless small{color:rgb(255 255 255/.4);font-size:8px}
.sprite-overrides{margin-top:18px;padding:16px;border:1px solid rgb(255 255 255/.09);border-radius:20px;background:#201d1b}.sprite-overrides__head{display:flex;justify-content:space-between;gap:12px;align-items:center}.sprite-overrides__head div{display:grid;gap:4px}.sprite-overrides__head strong{font-size:11px}.sprite-overrides__head button{min-height:30px;padding:0 9px;border:1px solid rgb(255 255 255/.12);border-radius:9px;background:#2b2724;color:#fff;font-size:8px}.sprite-overrides__grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:12px}.sprite-overrides__grid label{position:relative;display:grid;gap:4px;padding:7px;border:1px solid rgb(255 255 255/.08);border-radius:12px;background:#272320;cursor:pointer}.sprite-overrides__grid label.active{border-color:#ff6565}.sprite-overrides__grid img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:8px;background:#eee8df}.sprite-overrides__grid span{font-size:8px;font-weight:900}.sprite-overrides__grid input{position:absolute;width:1px;height:1px;opacity:0}.sprite-overrides__grid em{color:rgb(255 255 255/.4);font-size:7px;font-style:normal}.sprite-overrides__grid button{position:absolute;top:4px;right:4px;width:20px;height:20px;border:0;border-radius:50%;background:#171514;color:#fff}.sprite-overrides>p{margin:10px 0 0;color:rgb(255 255 255/.38);font-size:8px;line-height:1.45}
@media(max-width:900px){.sprite-lab__layout{grid-template-columns:1fr}.sprite-overrides__grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:620px){.sprite-lab{width:calc(100% - 18px);padding:16px}.sprite-lab__heading{display:block}.sprite-lab__heading>span{display:inline-block;margin-top:10px}.sprite-lab__selectors{grid-template-columns:1fr 1fr}.sprite-lab__pack-note{grid-column:1/-1}.sprite-preview__transport{grid-template-columns:1fr 1fr}.sprite-preview__transport input{grid-column:1/-1}.sprite-settings{grid-template-columns:1fr}.sprite-seamless{grid-column:auto}.sprite-overrides__grid{grid-template-columns:repeat(2,1fr)}}
</style>
