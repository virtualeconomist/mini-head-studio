<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import type {
  MotionExportBackground,
  MotionExportConfig,
  MotionExportFormat
} from '@/stella/motion-export'
import type { BackdropId } from '@/stella/backdrop'
import { useModalDialog } from '@/ui/useModalDialog'

const props = defineProps<{
  currentBackdrop: BackdropId
  duration: number
  supportedVideoFormats: Array<'mp4' | 'webm'>
}>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ export: [config: MotionExportConfig] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
useModalDialog(open, dialog)

const format = ref<MotionExportFormat>('gif')
const size = ref<320 | 512 | 1024>(512)
const fps = ref<10 | 15 | 20 | 24 | 30>(20)
const quality = ref<'standard' | 'high'>('high')
const background = ref<MotionExportBackground>('current')
const watermark = ref(false)
const watermarkText = ref('Mini Head Studio')
const watermarkOpacity = ref(0.72)

const formats = computed(() => [
  { id: 'gif' as const, label: 'GIF', detail: 'Universal, 256 colors', disabled: false },
  { id: 'mp4' as const, label: 'MP4', detail: 'Best compatibility', disabled: !props.supportedVideoFormats.includes('mp4') },
  { id: 'webm' as const, label: 'WebM', detail: 'Smaller web video', disabled: !props.supportedVideoFormats.includes('webm') }
])
const sizes = computed<Array<320 | 512 | 1024>>(() =>
  format.value === 'gif' ? [320, 512] : [512, 1024]
)
const frameRates = computed<Array<10 | 15 | 20 | 24 | 30>>(() =>
  format.value === 'gif' ? [10, 15, 20] : [15, 24, 30]
)
const frameCount = computed(() => Math.max(2, Math.round(props.duration * fps.value)))
const memoryEstimate = computed(() =>
  format.value === 'gif'
    ? Math.round((size.value * size.value * 4 * frameCount.value) / 1024 / 1024)
    : null
)
const currentBackdropLabel = computed(() => ({
  vanilla: 'Vanilla',
  blush: 'Blush',
  studio: 'Studio',
  transparent: 'Clear',
  solid: 'Custom color',
  gradient: 'Custom gradient',
  image: 'Custom image'
})[props.currentBackdrop])

watch(format, (next) => {
  size.value = next === 'gif' ? 512 : 1024
  fps.value = next === 'gif' ? 20 : 30
  if (
    next !== 'gif' &&
    (background.value === 'transparent' ||
      (background.value === 'current' && props.currentBackdrop === 'transparent'))
  ) {
    background.value = 'vanilla'
  }
})

watch(
  () => props.supportedVideoFormats,
  (supported) => {
    if (format.value !== 'gif' && !supported.includes(format.value)) format.value = 'gif'
  }
)

function selectFormat(next: MotionExportFormat) {
  const option = formats.value.find((item) => item.id === next)
  if (!option?.disabled) format.value = next
}

function submit() {
  emit('export', {
    format: format.value,
    size: size.value,
    fps: fps.value,
    quality: quality.value,
    background: background.value,
    watermark: watermark.value,
    watermarkText: watermarkText.value,
    watermarkOpacity: watermarkOpacity.value
  })
  open.value = false
}
</script>

<template>
  <dialog
    ref="dialog"
    class="motion-export-dialog"
    aria-label="Motion export settings"
    @close="open = false"
    @cancel.prevent="open = false"
  >
    <form class="motion-export-form" @submit.prevent="submit">
      <div class="motion-export-heading">
        <div><span class="eyebrow">MOTION EXPORT</span><h2>Export your loop</h2></div>
        <button type="button" aria-label="Close export settings" @click="open = false">×</button>
      </div>

      <section class="export-setting">
        <div class="export-setting__heading"><strong>Format</strong><span>Choose quality and compatibility</span></div>
        <div class="format-options" role="radiogroup" aria-label="Export format">
          <button
            v-for="option in formats"
            :key="option.id"
            type="button"
            role="radio"
            :aria-checked="format === option.id"
            :disabled="option.disabled"
            :class="{ 'is-selected': format === option.id }"
            @click="selectFormat(option.id)"
          >
            <strong>{{ option.label }}</strong><small>{{ option.disabled ? 'Unavailable here' : option.detail }}</small>
          </button>
        </div>
      </section>

      <div class="export-setting-grid">
        <section class="export-setting">
          <div class="export-setting__heading"><strong>Resolution</strong><span>Square output</span></div>
          <div class="choice-pills">
            <button v-for="value in sizes" :key="value" type="button" :class="{ 'is-selected': size === value }" @click="size = value">{{ value }} px</button>
          </div>
        </section>
        <section class="export-setting">
          <div class="export-setting__heading"><strong>Frame rate</strong><span>{{ frameCount }} frames total</span></div>
          <div class="choice-pills">
            <button v-for="value in frameRates" :key="value" type="button" :class="{ 'is-selected': fps === value }" @click="fps = value">{{ value }} fps</button>
          </div>
        </section>
      </div>

      <section v-if="format !== 'gif'" class="export-setting">
        <div class="export-setting__heading"><strong>Video quality</strong><span>Controls compression</span></div>
        <div class="choice-pills">
          <button type="button" :class="{ 'is-selected': quality === 'standard' }" @click="quality = 'standard'">Standard</button>
          <button type="button" :class="{ 'is-selected': quality === 'high' }" @click="quality = 'high'">High</button>
        </div>
      </section>

      <section class="export-setting">
        <div class="export-setting__heading"><strong>Background</strong><span>Video requires an opaque color</span></div>
        <div class="background-options">
          <label :class="{ 'is-disabled': format !== 'gif' && currentBackdrop === 'transparent' }"><input v-model="background" type="radio" value="current" :disabled="format !== 'gif' && currentBackdrop === 'transparent'" /><span class="background-chip background-chip--current" />Current ({{ currentBackdropLabel }})</label>
          <label><input v-model="background" type="radio" value="vanilla" /><span class="background-chip background-chip--vanilla" />Vanilla</label>
          <label><input v-model="background" type="radio" value="blush" /><span class="background-chip background-chip--blush" />Blush</label>
          <label><input v-model="background" type="radio" value="studio" /><span class="background-chip background-chip--studio" />Studio</label>
          <label v-if="format === 'gif'"><input v-model="background" type="radio" value="transparent" /><span class="background-chip background-chip--clear" />Transparent</label>
        </div>
      </section>

      <section class="export-setting watermark-setting">
        <label class="watermark-toggle"><input v-model="watermark" type="checkbox" /><span><strong>Add watermark</strong><small>Burn a label into every frame</small></span></label>
        <div v-if="watermark" class="watermark-fields">
          <label>Text<input v-model="watermarkText" maxlength="40" type="text" /></label>
          <label>Opacity <span>{{ Math.round(watermarkOpacity * 100) }}%</span><input v-model.number="watermarkOpacity" type="range" min="0.25" max="1" step="0.05" /></label>
        </div>
      </section>

      <p v-if="format === 'gif'" class="export-note">GIF is limited to 256 colors. Higher resolution improves edges but increases memory use<span v-if="memoryEstimate"> (about {{ memoryEstimate }} MB while encoding)</span>.</p>
      <p v-else class="export-note">{{ format.toUpperCase() }} exports are opaque and preserve the plush texture far better than GIF.</p>

      <div class="motion-export-actions">
        <button type="button" class="motion-export-cancel" @click="open = false">Cancel</button>
        <button type="submit" class="motion-export-confirm">Export {{ format.toUpperCase() }}</button>
      </div>
    </form>
  </dialog>
</template>
