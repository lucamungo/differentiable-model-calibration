<script setup>
import { computed } from 'vue';

const props = defineProps({
    width: { type: Number, default: 380 },
    height: { type: Number, default: 320 },
    strokeColor: { type: String, default: "#14b8a6" },
    fillColor: { type: String, default: "#ccfbf1" },
    trajectoryColor: { type: String, default: "#0d9488" },
});

// Center of the diagram
const cx = computed(() => props.width / 2);
const cy = computed(() => props.height / 2 + 15);

// Generate a spiral trajectory (damped oscillator style)
const numPoints = 120;
const trajectory = computed(() => {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints * 4 * Math.PI;
        const decay = Math.exp(-t / 8);
        const r = 100 * decay;
        const x = cx.value + r * Math.cos(t);
        const y = cy.value + r * Math.sin(t);
        points.push({ x, y, t });
    }
    return points;
});

// Path string for the trajectory
const trajectoryPath = computed(() => {
    if (trajectory.value.length === 0) return '';
    const pts = trajectory.value;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
});

// Select points for x0, x1, x2, x3, x4
const markedIndices = [0, 15, 30, 48, 70];
const markedPoints = computed(() => {
    return markedIndices.map((i, idx) => ({
        ...trajectory.value[i],
        label: `x${idx === 0 ? '₀' : idx === 1 ? '₁' : idx === 2 ? '₂' : idx === 3 ? '₃' : '₄'}`,
        index: i
    }));
});

// Calculate arrow positions and angles between consecutive points
const arrows = computed(() => {
    const result = [];
    for (let i = 0; i < markedIndices.length - 1; i++) {
        const startIdx = markedIndices[i];
        const endIdx = markedIndices[i + 1];
        // Get midpoint along the trajectory
        const midIdx = Math.floor((startIdx + endIdx) / 2);
        const midPoint = trajectory.value[midIdx];

        // Calculate tangent at midpoint for arrow direction
        const p1 = trajectory.value[Math.max(0, midIdx - 2)];
        const p2 = trajectory.value[Math.min(numPoints, midIdx + 2)];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const tangent = { dx: dx / len, dy: dy / len };

        // Calculate normal for Φ label offset
        const normal = { dx: -tangent.dy, dy: tangent.dx };

        result.push({
            x: midPoint.x,
            y: midPoint.y,
            tangent,
            normal,
            // Offset Φ label to the outside of the spiral
            labelX: midPoint.x + normal.dx * 18,
            labelY: midPoint.y + normal.dy * 18
        });
    }
    return result;
});

// Axis positions
const axisMargin = 50;

// Label offsets for each point (adjusted for better positioning)
const labelOffsets = [
    { dx: 12, dy: -8 },   // x0
    { dx: 8, dy: 18 },    // x1
    { dx: -22, dy: -8 },  // x2
    { dx: 8, dy: -14 },   // x3
    { dx: 12, dy: 8 },    // x4
];
</script>

<template>
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="dynamical-system-diagram">
        <!-- Axes -->
        <line
            :x1="axisMargin"
            :y1="height - axisMargin"
            :x2="width - 30"
            :y2="height - axisMargin"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-opacity="0.4"
        />
        <line
            :x1="axisMargin"
            :y1="height - axisMargin"
            :x2="axisMargin"
            :y2="30"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-opacity="0.4"
        />

        <!-- Axis labels -->
        <text :x="width - 25" :y="height - axisMargin + 5" class="axis-label">x₁</text>
        <text :x="axisMargin - 5" :y="25" class="axis-label">x₂</text>

        <!-- Trajectory path -->
        <path
            :d="trajectoryPath"
            fill="none"
            :stroke="trajectoryColor"
            stroke-width="2.5"
            stroke-linecap="round"
        />

        <!-- Arrows along trajectory with Φ labels -->
        <template v-for="(arrow, i) in arrows" :key="'arrow-' + i">
            <!-- Arrowhead -->
            <polygon
                :points="`${arrow.x + arrow.tangent.dx * 8},${arrow.y + arrow.tangent.dy * 8} ${arrow.x - arrow.tangent.dx * 4 - arrow.tangent.dy * 5},${arrow.y - arrow.tangent.dy * 4 + arrow.tangent.dx * 5} ${arrow.x - arrow.tangent.dx * 4 + arrow.tangent.dy * 5},${arrow.y - arrow.tangent.dy * 4 - arrow.tangent.dx * 5}`"
                :fill="trajectoryColor"
            />
            <!-- Φ label -->
            <text
                :x="arrow.labelX"
                :y="arrow.labelY"
                text-anchor="middle"
                dominant-baseline="middle"
                class="phi-label"
            >Φ</text>
        </template>

        <!-- Marked points -->
        <template v-for="(point, i) in markedPoints" :key="'point-' + i">
            <circle
                :cx="point.x"
                :cy="point.y"
                r="8"
                :fill="fillColor"
                :stroke="strokeColor"
                stroke-width="2"
            />
            <text
                :x="point.x + labelOffsets[i].dx"
                :y="point.y + labelOffsets[i].dy"
                class="point-label"
            >
                {{ point.label }}
            </text>
        </template>

        <!-- Title -->
        <text :x="width / 2" y="20" text-anchor="middle" class="title-label">Phase Space Trajectory</text>
    </svg>
</template>

<style scoped>
.dynamical-system-diagram {
    display: block;
    margin: 0 auto;
}

.axis-label {
    font-size: 14px;
    font-style: italic;
    fill: currentColor;
    opacity: 0.6;
}

.point-label {
    font-size: 13px;
    font-weight: 500;
    fill: currentColor;
    opacity: 0.85;
}

.phi-label {
    font-size: 13px;
    font-weight: 600;
    fill: #0d9488;
}

.title-label {
    font-size: 14px;
    font-weight: 500;
    fill: currentColor;
    opacity: 0.7;
}
</style>
