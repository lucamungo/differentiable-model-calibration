<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, required: true },
  iconColor: { type: String, default: '' },
  text: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  subtitleColor: { type: String, default: '' },
  color: { type: String, default: 'violet' },
  variant: { type: String, default: 'card' }, // 'card' or 'feature'
})

const isImagePath = computed(() => {
  return props.icon.startsWith('/') || props.icon.startsWith('http')
})

const isFeature = computed(() => props.variant === 'feature')
</script>

<template>
  <!-- Feature variant: icon, title, subtitle with centered layout -->
  <div
    v-if="isFeature"
    class="rounded-lg border-2 border-solid p-2 flex flex-col items-center transition-all duration-500 h-full"
    :class="[
      `border-${color}-300`,
      `bg-${color}-50/60`
    ]"
  >
    <div class="mb-1 flex-1 flex items-center justify-center">
      <img v-if="isImagePath" :src="icon" class="text-[45px] object-contain" />
      <div
        v-else
        :class="[
          icon,
          iconColor ? `text-${iconColor}-600` : `text-${color}-600`
        ]"
        class="text-[45px]"
      />
    </div>
    <div class="text-base">{{ title }}</div>
    <div
      v-if="subtitle"
      class="font-semibold flex items-center gap-1"
      :class="subtitleColor ? `text-${subtitleColor}-600` : `text-${color}-600`"
    >
      <span>{{ subtitle }}</span>
    </div>
    <slot />
  </div>

  <!-- Card variant: large icon with footer text -->
  <div
    v-else
    class="rounded-lg border-2 border-solid backdrop-blur flex-1 h-full"
    :class="[
      `border-${color}-300`,
      `bg-${color}-50/60`
    ]"
  >
    <div class="px-5 py-16 flex items-center justify-center">
      <img v-if="isImagePath" :src="icon" class="h-20 w-20 object-contain" />
      <div
        v-else
        :class="[
          icon,
          iconColor ? `text-${iconColor}-600` : variant === 'card' && !iconColor ? 'text-gray-800' : `text-${color}-600`
        ]"
        class="h-20 w-20"
      />
    </div>
    <div
      :class="`bg-${color}-100/60`"
      class="w-full px-4 py-2 h-[5rem] flex items-center justify-center text-center"
    >
      <slot>
        <span>{{ text }}</span>
      </slot>
    </div>
  </div>
</template>
