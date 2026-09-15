<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ANIMATION_MODES, animationModeDefinition, type AnimationModeId } from '@/stella/animation-mode'
import RigComparisonLab from './RigComparisonLab.vue'
import RigSequenceLab from './RigSequenceLab.vue'
import SpriteLoopLab from './SpriteLoopLab.vue'

const LAB_STORAGE_KEY = 'mini-head-rig-lab-visible'
const MODE_STORAGE_KEY = 'mini-head-animation-mode'
const comparisonOpen = ref(localStorage.getItem(LAB_STORAGE_KEY) === '1')
const storedMode = localStorage.getItem(MODE_STORAGE_KEY)
const activeMode = ref<AnimationModeId>(storedMode === 'sprite' || storedMode === 'rig' ? storedMode : 'rig')
const activeDefinition = computed(() => animationModeDefinition(activeMode.value))

watch(comparisonOpen, (value) => {
  localStorage.setItem(LAB_STORAGE_KEY, value ? '1' : '0')
})
watch(activeMode, (value) => {
  localStorage.setItem(MODE_STORAGE_KEY, value)
})
</script>

<template>
  <div class="rig-lab-page">
    <div class="rig-lab-page__bar">
      <div>
        <span>EXPERIMENTAL WORKSPACE</span>
        <strong>Animation Renderer Playground</strong>
      </div>
      <button
        v-if="activeMode === 'rig'"
        type="button"
        :aria-expanded="comparisonOpen"
        @click="comparisonOpen = !comparisonOpen"
      >
        {{ comparisonOpen ? 'Hide Rig Lab' : 'Show Rig Lab' }}
        <span aria-hidden="true">{{ comparisonOpen ? '−' : '+' }}</span>
      </button>
    </div>

    <section class="mode-picker" aria-label="Animation mode">
      <div class="mode-picker__intro">
        <span>ANIMATION MODE</span>
        <h2>One timeline, interchangeable renderers.</h2>
        <p>{{ activeDefinition.description }} <strong>{{ activeDefinition.bestFor }}</strong></p>
      </div>
      <div class="mode-picker__grid">
        <button
          v-for="mode in ANIMATION_MODES"
          :key="mode.id"
          type="button"
          :class="{ active: activeMode === mode.id }"
          :aria-pressed="activeMode === mode.id"
          @click="activeMode = mode.id"
        >
          <span>{{ mode.id === 'sprite' ? '▦' : '◇' }}</span>
          <div>
            <strong>{{ mode.label }}</strong>
            <small>{{ mode.description }}</small>
          </div>
          <em>{{ activeMode === mode.id ? 'ACTIVE' : 'SELECT' }}</em>
        </button>
      </div>
    </section>

    <SpriteLoopLab v-if="activeMode === 'sprite'" />
    <RigSequenceLab v-else />

    <div v-if="activeMode === 'rig'" class="rig-lab-page__tuning">
      <div class="rig-lab-page__tuning-copy">
        <div>
          <span>ADVANCED TUNING</span>
          <strong>Keep the comparison lab available for renderer experiments.</strong>
        </div>
        <button type="button" :aria-expanded="comparisonOpen" @click="comparisonOpen = !comparisonOpen">
          {{ comparisonOpen ? 'Collapse comparison lab' : 'Open comparison lab' }}
        </button>
      </div>
      <RigComparisonLab v-if="comparisonOpen" />
    </div>

    <div v-else class="rig-lab-page__architecture">
      <span>SPRITE LOOP STATUS</span>
      <strong>The original raster workflow remains supported as an intentional asset-driven mode.</strong>
      <p>Stella is now the first registered SpriteAssetPack. Add another permanent pack without changing the shared sequence engine, or use the session asset overrides above for quick prototypes.</p>
    </div>
  </div>
</template>

<style scoped>
.rig-lab-page{padding-bottom:34px;border-top:1px solid rgb(23 21 20/.08);background:linear-gradient(180deg,#f4efe6 0%,#eee8df 100%)}
.rig-lab-page__bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px max(18px,calc((100vw - 1180px)/2));border-bottom:1px solid rgb(23 21 20/.1);background:rgb(244 239 230/.9);backdrop-filter:blur(16px)}
.rig-lab-page__bar div{display:grid;gap:2px}.rig-lab-page__bar div span,.rig-lab-page__tuning-copy div span,.rig-lab-page__architecture>span,.mode-picker__intro>span{color:#d93333;font-size:8px;font-weight:950;letter-spacing:.13em}.rig-lab-page__bar div strong{color:#171514;font-size:11px}.rig-lab-page__bar button,.rig-lab-page__tuning-copy button{min-height:34px;padding:0 12px;border:1px solid rgb(23 21 20/.15);border-radius:999px;background:#fff;color:#171514;cursor:pointer;font:850 9px/1 system-ui}.rig-lab-page__bar button span{display:inline-block;margin-left:6px;font-size:14px;vertical-align:-1px}
.mode-picker{width:min(1180px,calc(100% - 32px));margin:24px auto 0;padding:18px;border:1px solid rgb(23 21 20/.11);border-radius:24px;background:rgb(255 255 255/.62);box-shadow:0 14px 42px rgb(34 25 20/.05)}.mode-picker__intro{display:grid;gap:5px}.mode-picker__intro h2{margin:0;color:#171514;font-size:clamp(20px,2.5vw,30px);letter-spacing:-.035em}.mode-picker__intro p{max-width:800px;margin:0;color:#766f68;font-size:10px;line-height:1.5}.mode-picker__intro p strong{color:#171514}.mode-picker__grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.mode-picker__grid button{display:grid;grid-template-columns:auto 1fr auto;gap:11px;align-items:center;padding:13px;text-align:left;border:1px solid rgb(23 21 20/.12);border-radius:16px;background:#fff;color:#171514;cursor:pointer}.mode-picker__grid button>span{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:#f1ece5;font-size:18px}.mode-picker__grid button div{display:grid;gap:3px}.mode-picker__grid button strong{font-size:11px}.mode-picker__grid button small{color:#817970;font-size:8px;line-height:1.4}.mode-picker__grid button em{padding:5px 7px;border-radius:999px;background:#f1ece5;color:#817970;font:900 7px/1 system-ui;font-style:normal;letter-spacing:.08em}.mode-picker__grid button.active{border-color:#171514;box-shadow:0 0 0 1px #171514 inset}.mode-picker__grid button.active>span,.mode-picker__grid button.active em{background:#171514;color:#fff}
.rig-lab-page__tuning,.rig-lab-page__architecture{width:min(1180px,calc(100% - 32px));margin:18px auto 0}.rig-lab-page__tuning-copy{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border:1px solid rgb(23 21 20/.12);border-radius:18px;background:rgb(255 255 255/.5)}.rig-lab-page__tuning-copy div{display:grid;gap:4px}.rig-lab-page__tuning-copy div strong{color:#171514;font-size:11px}.rig-lab-page__tuning :deep(.rig-lab){width:100%;margin:12px 0 0}.rig-lab-page__architecture{display:grid;gap:5px;padding:16px;border:1px solid rgb(23 21 20/.1);border-radius:18px;background:rgb(255 255 255/.5)}.rig-lab-page__architecture strong{color:#171514;font-size:11px}.rig-lab-page__architecture p{max-width:850px;margin:0;color:#766f68;font-size:9px;line-height:1.5}
@media(max-width:700px){.mode-picker__grid{grid-template-columns:1fr}}@media(max-width:560px){.rig-lab-page__bar,.rig-lab-page__tuning-copy{align-items:flex-start}.rig-lab-page__bar{padding:10px 12px}.mode-picker,.rig-lab-page__tuning,.rig-lab-page__architecture{width:calc(100% - 18px)}.rig-lab-page__tuning-copy{display:grid}}
</style>
