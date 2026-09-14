<script setup lang="ts">
import { ref } from 'vue'
import {
  BACKDROPS,
  GRADIENT_PRESETS,
  type BackdropId,
  type ImageLayout
} from '@/stella/backdrop'

const mode = defineModel<BackdropId>('mode', { required: true })
const solidColor = defineModel<string>('solidColor', { required: true })
const gradientStart = defineModel<string>('gradientStart', { required: true })
const gradientEnd = defineModel<string>('gradientEnd', { required: true })
const gradientAngle = defineModel<number>('gradientAngle', { required: true })
const imageUrl = defineModel<string | null>('imageUrl', { required: true })
const imageLayout = defineModel<ImageLayout>('imageLayout', { required: true })
const patternSize = defineModel<number>('patternSize', { required: true })
const fileInput = ref<HTMLInputElement | null>(null)
const uploadError = ref('')

function selectPreset(id: BackdropId) {
  mode.value = id
}

function selectGradient(preset: (typeof GRADIENT_PRESETS)[number]) {
  gradientStart.value = preset.start
  gradientEnd.value = preset.end
  gradientAngle.value = preset.angle
  mode.value = 'gradient'
}

function selectImageLayout(layout: ImageLayout) {
  imageLayout.value = layout
  if (imageUrl.value) mode.value = 'image'
}

function selectImageMode() {
  if (imageUrl.value) mode.value = 'image'
  else fileInput.value?.click()
}

function uploadImage(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Choose a PNG, JPG, WebP, GIF, or other image file.'
    return
  }
  if (file.size > 12 * 1024 * 1024) {
    uploadError.value = 'Choose an image smaller than 12 MB.'
    return
  }
  const reader = new FileReader()
  reader.onerror = () => (uploadError.value = 'That image could not be read.')
  reader.onload = () => {
    imageUrl.value = typeof reader.result === 'string' ? reader.result : null
    if (imageUrl.value) {
      uploadError.value = ''
      mode.value = 'image'
    }
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="swatches" aria-label="Backdrop presets">
    <button
      v-for="item in BACKDROPS"
      :key="item.id"
      type="button"
      :class="{ 'swatch--active': mode === item.id, 'swatch--clear': item.id === 'transparent' }"
      :style="{ '--swatch': item.color }"
      :aria-label="item.label"
      :aria-pressed="mode === item.id"
      @click="selectPreset(item.id)"
    />
  </div>

  <div class="backdrop-tabs" role="tablist" aria-label="Custom backdrop type">
    <button type="button" :class="{ 'is-selected': mode === 'solid' }" @click="mode = 'solid'">Solid</button>
    <button type="button" :class="{ 'is-selected': mode === 'gradient' }" @click="mode = 'gradient'">Gradient</button>
    <button type="button" :class="{ 'is-selected': mode === 'image' }" @click="selectImageMode">Image</button>
  </div>

  <div v-if="mode === 'solid'" class="backdrop-editor backdrop-editor--solid">
    <label><span>Backdrop color</span><input v-model="solidColor" type="color" @input="mode = 'solid'" /></label>
    <code>{{ solidColor.toUpperCase() }}</code>
  </div>

  <div v-else-if="mode === 'gradient'" class="backdrop-editor">
    <div class="gradient-colors">
      <label><span>Start</span><input v-model="gradientStart" type="color" /></label>
      <span aria-hidden="true">→</span>
      <label><span>End</span><input v-model="gradientEnd" type="color" /></label>
    </div>
    <label class="gradient-angle"><span>Angle <b>{{ gradientAngle }}°</b></span><input v-model.number="gradientAngle" type="range" min="0" max="360" step="5" /></label>
    <div class="gradient-presets" aria-label="Gradient presets">
      <button
        v-for="preset in GRADIENT_PRESETS"
        :key="preset.label"
        type="button"
        :title="preset.label"
        :style="{ backgroundImage: `linear-gradient(${preset.angle}deg, ${preset.start}, ${preset.end})` }"
        @click="selectGradient(preset)"
      />
    </div>
  </div>

  <div v-else-if="mode === 'image'" class="backdrop-editor backdrop-editor--image">
    <button class="image-upload" type="button" @click="fileInput?.click()">
      <span v-if="imageUrl" class="image-upload__preview" :style="{ backgroundImage: `url(${imageUrl})` }" />
      <span><strong>{{ imageUrl ? 'Replace image' : 'Upload an image' }}</strong><small>PNG, JPG, WebP or GIF · max 12 MB</small></span>
    </button>
    <div v-if="imageUrl" class="image-layouts" aria-label="Image layout">
      <button v-for="layout in (['fill', 'fit', 'pattern'] as const)" :key="layout" type="button" :class="{ 'is-selected': imageLayout === layout }" @click="selectImageLayout(layout)">{{ layout }}</button>
    </div>
    <label v-if="imageUrl && imageLayout === 'pattern'" class="gradient-angle"><span>Tile size <b>{{ patternSize }} px</b></span><input v-model.number="patternSize" type="range" min="64" max="320" step="8" /></label>
    <p v-if="uploadError" class="backdrop-error" role="alert">{{ uploadError }}</p>
  </div>

  <input ref="fileInput" class="sr-only" type="file" accept="image/*" @change="uploadImage" />
</template>
