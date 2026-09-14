<script setup lang="ts">
import { ref, watch } from 'vue'
import RigComparisonLab from './RigComparisonLab.vue'
import RigSequenceLab from './RigSequenceLab.vue'

const STORAGE_KEY = 'mini-head-rig-lab-visible'
const comparisonOpen = ref(localStorage.getItem(STORAGE_KEY) === '1')

watch(comparisonOpen, (value) => {
  localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
})
</script>

<template>
  <div class="rig-lab-page">
    <div class="rig-lab-page__bar">
      <div>
        <span>EXPERIMENTAL WORKSPACE</span>
        <strong>Modular Rig Playground</strong>
      </div>
      <button type="button" :aria-expanded="comparisonOpen" @click="comparisonOpen = !comparisonOpen">
        {{ comparisonOpen ? 'Hide Rig Lab' : 'Show Rig Lab' }}
        <span aria-hidden="true">{{ comparisonOpen ? '−' : '+' }}</span>
      </button>
    </div>

    <RigSequenceLab />

    <div class="rig-lab-page__tuning">
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
  </div>
</template>

<style scoped>
.rig-lab-page { padding-bottom:34px; border-top:1px solid rgb(23 21 20 / .08); background:linear-gradient(180deg,#f4efe6 0%,#eee8df 100%); }
.rig-lab-page__bar { position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px max(18px,calc((100vw - 1180px) / 2)); border-bottom:1px solid rgb(23 21 20 / .1); background:rgb(244 239 230 / .9); backdrop-filter:blur(16px); }
.rig-lab-page__bar div { display:grid; gap:2px; }
.rig-lab-page__bar div span, .rig-lab-page__tuning-copy div span { color:#d93333; font-size:8px; font-weight:950; letter-spacing:.13em; }
.rig-lab-page__bar div strong { color:#171514; font-size:11px; }
.rig-lab-page__bar button, .rig-lab-page__tuning-copy button { min-height:34px; padding:0 12px; border:1px solid rgb(23 21 20 / .15); border-radius:999px; background:#fff; color:#171514; cursor:pointer; font:850 9px/1 system-ui; }
.rig-lab-page__bar button span { display:inline-block; margin-left:6px; font-size:14px; vertical-align:-1px; }
.rig-lab-page__tuning { width:min(1180px,calc(100% - 32px)); margin:18px auto 0; }
.rig-lab-page__tuning-copy { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 16px; border:1px solid rgb(23 21 20 / .12); border-radius:18px; background:rgb(255 255 255 / .5); }
.rig-lab-page__tuning-copy div { display:grid; gap:4px; }
.rig-lab-page__tuning-copy div strong { color:#171514; font-size:11px; }
.rig-lab-page__tuning :deep(.rig-lab) { width:100%; margin:12px 0 0; }
@media (max-width:560px) {
  .rig-lab-page__bar, .rig-lab-page__tuning-copy { align-items:flex-start; }
  .rig-lab-page__bar { padding:10px 12px; }
  .rig-lab-page__tuning { width:calc(100% - 18px); }
  .rig-lab-page__tuning-copy { display:grid; }
}
</style>
