<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  GENERATED_ASSET_CELL_COUNT,
  GENERATED_ASSET_CELL_SIZE,
  STELLA_GENERATED_ASSET_SHEET,
  accessoryDefinition,
  generatedAssetImageStyle,
  generatedAssetTransformStyle,
  modularHairDefinition,
  type AccessoryId,
  type AccessoryPlacement,
  type GeneratedAssetId,
  type HairPlacement,
  type ModularHairId
} from '@/stella/rig'

const props = defineProps<{
  faceSvg: string
  compatibilitySvg: string
  hairId: ModularHairId
  hairPlacement: HairPlacement
  accessoryId: AccessoryId
  accessoryPlacement: AccessoryPlacement
}>()

const hairDefinition = computed(() => modularHairDefinition(props.hairId))
const accessory = computed(() => accessoryDefinition(props.accessoryId))
const legacyHair = computed(() => hairDefinition.value?.sourceKind === 'raster-shell')

const baseImageStyle = generatedAssetImageStyle('base-head')
const hairAssetId = computed<GeneratedAssetId | null>(() => {
  const hair = hairDefinition.value
  if (!hair || hair.sourceKind !== 'generated-overlay' || !hair.generatedAsset) return null
  return hair.generatedAsset
})
const hairImageStyle = computed(() => hairAssetId.value ? generatedAssetImageStyle(hairAssetId.value) : null)
const hairTransformStyle = computed(() => generatedAssetTransformStyle(props.hairPlacement))
const accessoryAssetId = computed<GeneratedAssetId | null>(() => accessory.value?.generatedAsset ?? null)
const accessoryImageStyle = computed(() => accessoryAssetId.value ? generatedAssetImageStyle(accessoryAssetId.value) : null)
const accessoryTransformStyle = computed(() => generatedAssetTransformStyle(props.accessoryPlacement))

const assetProbeState = ref<'loading' | 'loaded' | 'error' | 'tainted'>('loading')
const assetProbeSize = ref('')
const assetVisibleCells = ref(0)
const assetCellCoverage = ref<number[]>([])

function inspectAssetSheet(image: HTMLImageElement) {
  assetProbeSize.value = `${image.naturalWidth}×${image.naturalHeight}`

  try {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('No 2D canvas context')

    context.drawImage(image, 0, 0)
    const sampleStep = 16
    const coverage: number[] = []

    for (let cell = 0; cell < GENERATED_ASSET_CELL_COUNT; cell += 1) {
      let visible = 0
      let samples = 0
      const yStart = cell * GENERATED_ASSET_CELL_SIZE
      for (let y = yStart; y < yStart + GENERATED_ASSET_CELL_SIZE; y += sampleStep) {
        for (let x = 0; x < GENERATED_ASSET_CELL_SIZE; x += sampleStep) {
          const alpha = context.getImageData(x, y, 1, 1).data[3] ?? 0
          samples += 1
          if (alpha > 8) visible += 1
        }
      }
      coverage.push(samples ? visible / samples : 0)
    }

    assetCellCoverage.value = coverage
    assetVisibleCells.value = coverage.filter((value) => value > 0.002).length
    assetProbeState.value = 'loaded'
  } catch {
    assetProbeState.value = 'tainted'
  }
}

function onAssetSheetLoad(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  inspectAssetSheet(image)
}

function onAssetSheetError() {
  assetProbeState.value = 'error'
  assetProbeSize.value = ''
  assetVisibleCells.value = 0
  assetCellCoverage.value = []
}

const assetProbeLabel = computed(() => {
  if (assetProbeState.value === 'loading') return 'Asset sheet · loading…'
  if (assetProbeState.value === 'error') return 'Asset sheet · LOAD ERROR'
  if (assetProbeState.value === 'tainted') return `Asset sheet · loaded ${assetProbeSize.value} · pixel probe blocked`
  return `Asset sheet · loaded ${assetProbeSize.value} · visible cells ${assetVisibleCells.value}/${GENERATED_ASSET_CELL_COUNT}`
})
</script>

<template>
  <div
    class="character-compositor"
    :data-renderer="legacyHair ? 'legacy-svg-shell' : 'dom-img-svg'"
    :data-asset-probe="assetProbeState"
    :data-visible-asset-cells="assetVisibleCells"
  >
    <div
      v-if="legacyHair"
      class="character-layer compatibility-layer"
      data-character-layer="legacy-character"
      v-html="compatibilitySvg"
    />

    <template v-else>
      <div
        class="character-layer raster-layer base-head-layer"
        data-character-layer="base-head"
        data-generated-asset="base-head"
      >
        <img
          class="asset-sheet-image"
          :src="STELLA_GENERATED_ASSET_SHEET"
          :style="baseImageStyle"
          alt=""
          aria-hidden="true"
          draggable="false"
          @load="onAssetSheetLoad"
          @error="onAssetSheetError"
        />
      </div>

      <div
        class="character-layer face-layer"
        data-character-layer="face-rig"
        v-html="faceSvg"
      />

      <div
        v-if="hairAssetId && hairImageStyle"
        class="character-layer raster-layer hair-layer"
        data-character-layer="hair"
        :data-generated-asset="hairAssetId"
        :data-hair-id="hairId"
        :style="hairTransformStyle"
      >
        <img
          class="asset-sheet-image"
          :src="STELLA_GENERATED_ASSET_SHEET"
          :style="hairImageStyle"
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      </div>
    </template>

    <div
      v-if="accessoryAssetId && accessoryImageStyle && accessory"
      class="character-layer raster-layer accessory-layer"
      data-character-layer="accessory"
      :data-generated-asset="accessoryAssetId"
      :data-accessory-id="accessoryId"
      :style="accessoryTransformStyle"
    >
      <img
        class="asset-sheet-image"
        :src="STELLA_GENERATED_ASSET_SHEET"
        :style="accessoryImageStyle"
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </div>

    <div class="asset-probe" :class="`asset-probe-${assetProbeState}`">
      <span>{{ assetProbeLabel }}</span>
      <span v-if="assetCellCoverage.length" class="asset-probe-cells">
        {{ assetCellCoverage.map((value, index) => `${index + 1}:${Math.round(value * 100)}%`).join(' · ') }}
      </span>
      <a :href="STELLA_GENERATED_ASSET_SHEET" target="_blank" rel="noreferrer">open raw sheet</a>
    </div>
  </div>
</template>

<style scoped>
.character-compositor {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  isolation: isolate;
}
.character-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.raster-layer {
  overflow: hidden;
}
.asset-sheet-image {
  display: block;
  pointer-events: none;
  user-select: none;
}
.base-head-layer { z-index: 0; }
.face-layer,
.compatibility-layer { z-index: 1; }
.hair-layer { z-index: 2; }
.accessory-layer { z-index: 3; }
.face-layer :deep(svg),
.compatibility-layer :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
.asset-probe {
  position: absolute;
  z-index: 20;
  left: 8px;
  right: 8px;
  bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 7px 9px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  background: rgba(10, 10, 10, 0.82);
  color: white;
  font: 600 10px/1.25 ui-monospace, SFMono-Regular, Menlo, monospace;
  pointer-events: auto;
  backdrop-filter: blur(8px);
}
.asset-probe-loaded { border-color: rgba(95, 220, 135, 0.65); }
.asset-probe-error { border-color: rgba(255, 82, 82, 0.85); }
.asset-probe-cells { opacity: 0.72; }
.asset-probe a {
  margin-left: auto;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
