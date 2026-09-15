<script setup lang="ts">
import { computed } from 'vue'
import {
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
</script>

<template>
  <div
    class="character-compositor"
    :data-renderer="legacyHair ? 'legacy-svg-shell' : 'dom-img-svg'"
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
</style>
