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

// Append a cache-busting query param to force reload
const iframeSrc = computed(() => {
    const separator = props.src.includes("?") ? "&" : "?";
    return `${props.src}${separator}_reload=${reloadKey.value}`;
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
