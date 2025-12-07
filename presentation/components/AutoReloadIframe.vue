<script setup>
import { ref, watch, computed } from "vue";
import { useIsSlideActive } from "@slidev/client";

const props = defineProps({
    src: {
        type: String,
        required: true,
    },
    class: {
        type: String,
        default: "",
    },
});

const isActive = useIsSlideActive();
const reloadKey = ref(0);

// Get base URL (handles GitHub Pages subdirectory deployment)
const base = import.meta.env.BASE_URL;

// Build the full src with base path and cache-busting param
const iframeSrc = computed(() => {
    // Remove leading slash from src if base already ends with one
    const srcPath = props.src.startsWith("/") ? props.src.slice(1) : props.src;
    const fullPath = `${base}${srcPath}`;
    const separator = fullPath.includes("?") ? "&" : "?";
    return `${fullPath}${separator}_reload=${reloadKey.value}`;
});

// Reload iframe whenever slide becomes active
watch(isActive, (active, wasActive) => {
    if (active && !wasActive) {
        reloadKey.value++;
    }
});
</script>

<template>
    <iframe
        :src="iframeSrc"
        :class="props.class"
        style="border: none; outline: none; background: white"
        frameborder="0"
    ></iframe>
</template>
