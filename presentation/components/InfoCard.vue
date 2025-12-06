<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  bgColor: { type: String, default: 'indigo' },
  borderColor: { type: String, default: 'indigo' },
})

const bgClass = computed(() => `bg-${props.bgColor}-800/20`)
const borderClass = computed(() => `border-${props.borderColor}-600`)
</script>

<template>
  <div
    :class="[bgClass, borderClass]"
    border="2 solid"
    rounded-lg
    flex-1
    px-3
    py-2
  >
    <div><span>{{ title }}</span></div>
    <div text-zinc-400 text-sm><span>{{ description }}</span></div>
  </div>
</template>
