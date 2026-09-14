<script setup lang="ts">
import { computed } from 'vue'
import { MOTIONS, type MotionId } from '@/stella/catalog'

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    motion?: MotionId
    motionKey?: number
    playing?: boolean
    speed?: number
    compact?: boolean
    followX?: number
    followY?: number
  }>(),
  { motion: 'idle', motionKey: 0, playing: true, speed: 1, compact: false, followX: 0, followY: 0 }
)

const style = computed(() => ({
  '--motion-speed': String(props.speed),
  '--motion-duration': `${(MOTIONS.find((item) => item.id === props.motion)?.seconds ?? 3.2) / props.speed}s`,
  '--idle-duration': `${3.2 / props.speed}s`,
  '--play-state': props.playing ? 'running' : 'paused',
  '--follow-transform': `perspective(720px) translate(${props.followX * 4.5}%, ${props.followY * 3.5}%) rotateX(${props.followY * -7}deg) rotateY(${props.followX * 9}deg) rotate(${props.followX * 1.5}deg) scale(1.01)`
}))
</script>

<template>
  <div
    class="stella-head"
    :class="[`motion-${props.motion}`, { 'stella-head--compact': props.compact }]"
    :style="style"
  >
    <div :key="props.motionKey" class="stella-head__motion">
      <img class="stella-head__image" :src="props.src" :alt="props.alt" draggable="false" />
      <span class="stella-head__spark stella-head__spark--one">✦</span>
      <span class="stella-head__spark stella-head__spark--two">·</span>
    </div>
    <div class="stella-head__shadow" aria-hidden="true" />
  </div>
</template>
