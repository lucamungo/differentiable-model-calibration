<script setup>
import { useSlots } from "vue";

const props = defineProps({
    title: { type: String, default: "" },
});

const slots = useSlots();
</script>

<template>
    <div
        class="bg-black/5 backdrop-blur-sm border border-black/10 rounded-lg p-4 h-full"
    >
        <h3 v-if="title" class="mb-2">{{ title }}</h3>
        <div class="text-sm prose">
            <slot />
        </div>
    </div>
</template>

<style scoped>
.prose :deep(> *:first-child) {
    margin-top: 0;
}

.prose :deep(> *:last-child) {
    margin-bottom: 0;
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

.prose :deep(code) {
    background: rgba(0, 0, 0, 0.08);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
}

.prose :deep(.katex) {
    font-size: 1em;
}
</style>
