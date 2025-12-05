<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Styling
  color: { type: String, default: 'purple' },
  variant: { type: String, default: 'card' }, // 'card' or 'box'

  // Header props (can be overridden with header slot)
  icon: { type: String, default: '' },
  iconColor: { type: String, default: '' },
  title: { type: String, default: '' },

  // Description
  description: { type: String, default: '' },
  headerText: { type: String, default: '' },

  // Layout
  fullHeight: { type: Boolean, default: true },
  marginTop: { type: Number, default: 0 },

  // Content rendering
  prose: { type: Boolean, default: true }
})

// Variant-specific styles
const isBox = computed(() => props.variant === 'box')

const borderClass = computed(() => {
  if (isBox.value) {
    return props.color === 'neutral'
      ? 'border-neutral-300'
      : `border-${props.color}-300`
  }
  return `border-${props.color}-300`
})

const bgClass = computed(() => {
  if (isBox.value) {
    return props.color === 'neutral'
      ? 'bg-neutral-100/60'
      : `bg-${props.color}-50/60`
  }
  return `bg-${props.color}-50/60`
})

const headerBgClass = computed(() => {
  if (!isBox.value) return ''
  return props.color === 'neutral'
    ? 'bg-neutral-200/60'
    : `bg-${props.color}-100/60`
})

const headerTextClass = computed(() => {
  if (!isBox.value) return ''
  return props.color === 'neutral'
    ? ''
    : `text-${props.color}-700`
})

const computedIconColor = computed(() => {
  if (props.iconColor) {
    return `text-${props.iconColor}-600`
  }
  return `text-${props.color}-600`
})
</script>

<template>
  <!-- Box variant: centered with max-width and header bar -->
  <div
    v-if="isBox"
    flex
    items-center
    justify-center
    :class="fullHeight ? 'h-full' : ''"
    :style="{ marginTop: `${marginTop}rem` }"
  >
    <div
      border="2 solid"
      :class="[borderClass, bgClass]"
      rounded-lg
      overflow-hidden
      max-w-120
    >
      <div :class="[headerBgClass, headerTextClass]" px-4 py-2 flex items-center>
        <div v-if="icon" :class="[icon, computedIconColor]" text-xl mr-2 />
        <div>
          <span font-bold>{{ title }}</span>
          <div v-if="headerText" text-xs italic mt-0.5>{{ headerText }}</div>
        </div>
      </div>
      <div px-5 py-4>
        <div :class="['content-area', prose ? 'prose' : '']">
          <slot />
        </div>
      </div>
    </div>
  </div>

  <!-- Card variant: simple card with flexible header -->
  <div
    v-else
    :class="[borderClass, bgClass, fullHeight ? 'h-full' : '']"
    :style="{ marginTop: `${marginTop}rem` }"
    border="2 solid"
    rounded-lg
    p-4
  >
    <!-- Header Section -->
    <slot name="header">
      <div v-if="icon || title" flex items-center mb-3>
        <div v-if="icon" :class="[icon, computedIconColor]" text-2xl mr-2 />
        <span font-bold text-lg>{{ title }}</span>
      </div>
    </slot>

    <!-- Description Section -->
    <slot name="description">
      <div v-if="description" text-sm mb-3 opacity-70>
        {{ description }}
      </div>
    </slot>

    <!-- Main Content (accepts any markdown/HTML) -->
    <div :class="['content-area', prose ? 'prose' : '']">
      <slot />
    </div>

    <!-- Footer Section (for lists, notes, etc.) -->
    <slot name="footer" />
  </div>
</template>

<style scoped>
.content-area :deep(> *:first-child) {
  margin-top: 0;
}

.content-area :deep(> *:last-child) {
  margin-bottom: 0;
}

/* Markdown/Prose support */
.prose :deep(code) {
  background: rgba(0, 0, 0, 0.08);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}

.prose :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
}

.prose :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
}

.prose :deep(table) {
  width: 100%;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.prose :deep(th),
.prose :deep(td) {
  padding: 0.5rem;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.prose :deep(th) {
  background: rgba(0, 0, 0, 0.05);
  font-weight: bold;
}
</style>
