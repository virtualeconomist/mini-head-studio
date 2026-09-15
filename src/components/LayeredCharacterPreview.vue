<script setup lang="ts">
import { computed } from 'vue'
import {
  accessoryDefinition,
  generatedAssetLayerStyle,
  modularHairDefinition,
  type AccessoryId,
  type AccessoryPlacement,
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

const baseStyle = computed(() => generatedAssetLayerStyle('base-head'))
const hairStyle = computed(() => {
  const hair = hairDefinition.value
  if (!hair || hair.sourceKind !== 'generated-overlay' || !hair.generatedAsset) return null
  return generatedAssetLayerStyle(hair.generatedAsset, props.hairPlacement)
})
const accessoryStyle = computed(() => {
  if (!accessory.value) return null
  return generatedAssetLayerStyle(accessory.value.generatedAsset, props.accessoryPlacement)
})
</script>

<template>
  <div
    class="character-compositor"
    :data-renderer="legacyHair ? 'legacy-svg-shell' : 'dom-raster-svg'"
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
        :style="baseStyle"
      />
      <div
        class="character-layer face-layer"
        data-character-layer="face-rig"
        v-html="faceSvg"
      />
      <div
        v-if="hairStyle && hairDefinition?.generatedAsset"
        class="character-layer raster-layer hair-layer"
        data-character-layer="hair"
        :data-generated-asset="hairDefinition.generatedAsset"
        :data-hair-id="hairId"
        :style="hairStyle"
      />
    </template>

    <div
      v-if="accessoryStyle && accessory"
      class="character-layer raster-layer accessory-layer"
      data-character-layer="accessory"
      :data-generated-asset="accessory.generatedAsset"
      :data-accessory-id="accessoryId"
      :style="accessoryStyle"
    />
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
  background-repeat: no-repeat;
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
