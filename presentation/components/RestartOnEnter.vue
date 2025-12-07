<script setup>
import { ref, watch } from "vue";
import { useIsSlideActive } from "@slidev/client";

const isActive = useIsSlideActive();
const key = ref(0);

// Increment key whenever slide becomes active (not just on mount)
watch(isActive, (active, wasActive) => {
    if (active && !wasActive) {
        key.value++;
    }
});
</script>

<template>
    <div :key="key" class="restart-wrapper">
        <slot />
    </div>
</template>

<style scoped>
.restart-wrapper {
    display: contents;
}
</style>
