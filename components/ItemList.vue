<script setup>
import { computed } from "vue";

const props = defineProps({
  items: { type: Array, required: true },
  icon: { type: String, default: "" },
  iconColor: { type: String, default: "blue" },
  animated: { type: Boolean, default: false },
  clickOffset: { type: Number, default: 0 },
  gap: { type: String, default: "2" },
});

const iconColorClass = computed(() => `text-${props.iconColor}-400`);
</script>

<template>
  <div>
    <div
      v-for="(item, idx) in items"
      :key="item"
      flex
      items-center
      :class="`gap-${gap} mb-${gap}`"
    >
      <template v-if="animated">
        <div
          v-click="clickOffset + idx"
          :class="[
            $clicks < clickOffset + idx
              ? 'opacity-0 translate-x--10'
              : 'opacity-100 translate-x-0',
            `gap-${gap}`
          ]"
          transition
          duration-300
          ease-in-out
          flex
          items-center
          w-full
        >
          <div v-if="icon" :class="[icon, iconColorClass]" />
          <span>{{ item }}</span>
        </div>
      </template>
      <template v-else>
        <div v-if="icon" :class="[icon, iconColorClass]" />
        <span>{{ item }}</span>
      </template>
    </div>
  </div>
</template>
