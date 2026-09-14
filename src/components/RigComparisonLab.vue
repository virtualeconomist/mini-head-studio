<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { EXPRESSIONS, HAIRS, spritePath, type ExpressionId, type HairId } from '@/stella/catalog'
import {
  STELLA_EXPRESSION_PRESETS,
  STELLA_RIG_MANIFEST,
  interpolateFaceRigState,
  renderFaceRigSvg
} from '@/stella/rig'

const hair = ref<HairId>('plush-bob')
const fromExpression = ref<ExpressionId>('happy')
const toExpression = ref<ExpressionId>('love')
const progress = ref(0.5)
const playing = ref(false)
let frame = 0
let startedAt = 0

const fromSprite = computed(() => spritePath(hair.value, fromExpression.value))
const toSprite = computed(() => spritePath(hair.value, toExpression.value))
const fromState = computed(() => STELLA_EXPRESSION_PRESETS[fromExpression.value])
const toState = computed(() => STELLA_EXPRESSION_PRESETS[toExpression.value])
const blendedState = computed(() =>
  interpolateFaceRigState(fromState.value, toState.value, progress.value)
)

const fromSvg = computed(() =>
  renderFaceRigSvg(STELLA_RIG_MANIFEST, fromState.value, `${fromExpression.value} modular rig`)
)
const toSvg = computed(() =>
  renderFaceRigSvg(STELLA_RIG_MANIFEST, toState.value, `${toExpression.value} modular rig`)
)
const blendedSvg = computed(() =>
  renderFaceRigSvg(
    STELLA_RIG_MANIFEST,
    blendedState.value,
    `${fromExpression.value} to ${toExpression.value} blend`
  )
)

function tick(now: number) {
  if (!playing.value) return
  if (!startedAt) startedAt = now
  const phase = ((now - startedAt) % 1800) / 1800
  progress.value = phase < 0.5 ? phase * 2 : 2 - phase * 2
  frame = requestAnimationFrame(tick)
}

function togglePlayback() {
  playing.value = !playing.value
  cancelAnimationFrame(frame)
  if (playing.value) {
    startedAt = 0
    frame = requestAnimationFrame(tick)
  }
}

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <section class="rig-lab" aria-label="Experimental modular face rig comparison">
    <div class="rig-lab__heading">
      <div>
        <span class="rig-lab__eyebrow">EXPERIMENTAL · BRANCH PREVIEW</span>
        <h2>Modular Face Rig Lab</h2>
        <p>
          Compare Stella's current baked sprite against the new renderer-independent SVG face rig.
          Hair is intentionally still shown only in the reference sprite at this stage.
        </p>
      </div>
      <span class="rig-lab__badge">?lab=rig</span>
    </div>

    <div class="rig-lab__controls">
      <label>
        <span>Reference hair</span>
        <select v-model="hair">
          <option v-for="item in HAIRS" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>From</span>
        <select v-model="fromExpression">
          <option v-for="item in EXPRESSIONS" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>To</span>
        <select v-model="toExpression">
          <option v-for="item in EXPRESSIONS" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>
      <button type="button" class="rig-lab__play" :class="{ 'is-playing': playing }" @click="togglePlayback">
        {{ playing ? 'Ⅱ Pause blend' : '▶ Play blend' }}
      </button>
    </div>

    <div class="rig-lab__blend-control">
      <span>{{ fromExpression }}</span>
      <input v-model.number="progress" type="range" min="0" max="1" step="0.01" aria-label="Expression interpolation progress" />
      <span>{{ toExpression }}</span>
      <strong>{{ Math.round(progress * 100) }}%</strong>
    </div>

    <div class="rig-lab__grid">
      <article class="rig-card">
        <div class="rig-card__label"><span>REFERENCE SPRITE</span><strong>{{ fromExpression }}</strong></div>
        <img :src="fromSprite" alt="" />
      </article>

      <article class="rig-card rig-card--vector">
        <div class="rig-card__label"><span>MODULAR SVG</span><strong>{{ fromExpression }}</strong></div>
        <div class="rig-card__svg" v-html="fromSvg" />
      </article>

      <article class="rig-card">
        <div class="rig-card__label"><span>REFERENCE SPRITE</span><strong>{{ toExpression }}</strong></div>
        <img :src="toSprite" alt="" />
      </article>

      <article class="rig-card rig-card--vector">
        <div class="rig-card__label"><span>MODULAR SVG</span><strong>{{ toExpression }}</strong></div>
        <div class="rig-card__svg" v-html="toSvg" />
      </article>

      <article class="rig-card rig-card--blend">
        <div class="rig-card__label">
          <span>TRUE PARAMETER BLEND</span>
          <strong>{{ fromExpression }} → {{ toExpression }} · {{ Math.round(progress * 100) }}%</strong>
        </div>
        <div class="rig-card__svg rig-card__svg--blend" v-html="blendedSvg" />
        <p>
          This frame is generated from interpolated eye, brow, mouth, blush and effect parameters — not a crossfade between two raster images.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.rig-lab {
  width: min(1180px, calc(100% - 32px));
  margin: 34px auto 48px;
  padding: 24px;
  border: 1px solid rgb(23 21 20 / 0.14);
  border-radius: 28px;
  background: rgb(255 255 255 / 0.62);
  box-shadow: 0 24px 70px rgb(34 25 20 / 0.08);
}
.rig-lab__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}
.rig-lab__heading h2 { margin: 4px 0 7px; font-size: clamp(24px, 3vw, 38px); letter-spacing: -0.04em; }
.rig-lab__heading p { max-width: 720px; margin: 0; color: #756e67; font-size: 12px; line-height: 1.6; }
.rig-lab__eyebrow { color: #d93333; font-size: 10px; font-weight: 950; letter-spacing: 0.14em; }
.rig-lab__badge { flex: none; padding: 7px 10px; border-radius: 999px; background: #171514; color: #fff; font: 800 10px/1 system-ui; }
.rig-lab__controls { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-bottom: 14px; }
.rig-lab__controls label { display: grid; gap: 6px; min-width: 145px; color: #766f68; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; }
.rig-lab__controls select { height: 38px; padding: 0 10px; border: 1px solid rgb(23 21 20 / 0.16); border-radius: 11px; background: #fff; color: #171514; font: 750 11px/1 system-ui; }
.rig-lab__play { height: 38px; padding: 0 14px; border: 1px solid #171514; border-radius: 11px; background: #fff; color: #171514; cursor: pointer; font: 900 10px/1 system-ui; }
.rig-lab__play.is-playing { background: #171514; color: #fff; }
.rig-lab__blend-control { display: grid; grid-template-columns: auto minmax(160px, 1fr) auto 48px; gap: 10px; align-items: center; margin: 14px 0 18px; color: #766f68; font: 800 10px/1 system-ui; text-transform: capitalize; }
.rig-lab__blend-control input { width: 100%; accent-color: #d93333; }
.rig-lab__blend-control strong { color: #171514; text-align: right; }
.rig-lab__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.rig-card { min-width: 0; padding: 13px; border: 1px solid rgb(23 21 20 / 0.11); border-radius: 20px; background: #f7f2ea; overflow: hidden; }
.rig-card--vector { background: #eef3f5; }
.rig-card--blend { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(170px, 320px) 1fr; align-items: center; gap: 20px; background: #171514; color: #fff; }
.rig-card--blend .rig-card__label { grid-column: 1 / -1; }
.rig-card--blend p { margin: 0; max-width: 520px; color: rgb(255 255 255 / 0.62); font-size: 11px; line-height: 1.6; }
.rig-card__label { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 8px; }
.rig-card__label span { color: #8d857d; font-size: 8px; font-weight: 950; letter-spacing: 0.1em; }
.rig-card__label strong { font-size: 10px; text-transform: capitalize; }
.rig-card img, .rig-card__svg :deep(svg) { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; }
.rig-card__svg--blend { width: min(100%, 300px); }
@media (max-width: 860px) {
  .rig-lab__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rig-card--blend { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .rig-lab { width: calc(100% - 18px); padding: 16px; border-radius: 22px; }
  .rig-lab__heading { display: block; }
  .rig-lab__badge { display: inline-block; margin-top: 12px; }
  .rig-lab__controls label { flex: 1 1 42%; min-width: 0; }
  .rig-lab__play { flex: 1 1 100%; }
  .rig-lab__blend-control { grid-template-columns: 1fr auto; }
  .rig-lab__blend-control input { grid-column: 1 / -1; grid-row: 2; }
  .rig-lab__grid { grid-template-columns: 1fr; }
  .rig-card--blend { grid-column: auto; grid-template-columns: 1fr; }
}
</style>
