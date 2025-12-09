<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
    // Trail length (number of points to keep)
    trailLength: { type: Number, default: 10000 },
    // Speed of dynamics (steps per frame)
    speed: { type: Number, default: 100 },
    // Time step for integration
    dt: { type: Number, default: 0.001 },
});

const canvas = ref(null);
let animationId = null;
let ctx = null;

// Use fixed dimensions matching Slidev's internal slide size
const width = 980;
const height = 552;

// Lorenz system parameters
const sigma = 10;
const rho = 28;
const beta = 8 / 3;
const transparency = 0.5;

// Color settings
const baseHue = 212;
const saturation = 96;
const lightness = 78;

// Initial conditions
let x = 0.1;
let y = 0;
let z = 0;

// Trail state
let maxTrailPoints = 0;
let points = null;
let pointHead = 0;
let pointCount = 0;

// Number of color bands for batched drawing
const numBands = 20;

// Pre-calculate rotation constants
const angle = -Math.PI / 2;
const cos = Math.cos(angle);
const sin = Math.sin(angle);

// Drawing parameters
const scale = 18;
const scaleX = 1.8;
const offsetX = width / 2;
const offsetY =  height * 1.2;

function resetState() {
    x = 0.1;
    y = 0;
    z = 0;
    maxTrailPoints = props.trailLength;
    points = new Float32Array(maxTrailPoints * 3);
    pointHead = 0;
    pointCount = 0;
}

function addPoint(px, py, pz) {
    const idx = pointHead * 3;
    points[idx] = px;
    points[idx + 1] = py;
    points[idx + 2] = pz;
    pointHead = (pointHead + 1) % maxTrailPoints;
    if (pointCount < maxTrailPoints) pointCount++;
}

onMounted(() => {
    const canvasEl = canvas.value;
    if (!canvasEl) return;

    // Use fixed canvas buffer size, let CSS handle display scaling
    const pixelRatio = 2; // Use 2x for crisp rendering
    canvasEl.width = width * pixelRatio;
    canvasEl.height = height * pixelRatio;

    ctx = canvasEl.getContext("2d");
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    resetState();

    // Initial clear
    ctx.fillStyle = "rgba(251, 252, 255, 1)";
    ctx.fillRect(0, 0, width, height);

    function lorenzStep() {
        const dx = sigma * (y - x) * props.dt;
        const dy = (x * (rho - z) - y) * props.dt;
        const dz = (x * y - beta * z) * props.dt;

        x += dx;
        y += dy;
        z += dz;

        addPoint(x, y, z);
    }

    function draw() {
        ctx.fillStyle = "rgba(251, 252, 255, 0.05)";
        ctx.fillRect(0, 0, width, height);

        if (pointCount < 2) return;

        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";

        const start = pointCount < maxTrailPoints ? 0 : pointHead;
        const bandSize = Math.ceil(pointCount / numBands);

        // Draw segments in batches by alpha band
        for (let band = 0; band < numBands; band++) {
            const bandStart = band * bandSize;
            const bandEnd = Math.min((band + 1) * bandSize, pointCount);

            if (bandStart >= pointCount) break;

            // Calculate alpha for this band (middle of band)
            const midPoint = (bandStart + bandEnd) / 2;
            const alpha = (midPoint / maxTrailPoints) * transparency;

            ctx.strokeStyle = `hsla(${baseHue}, ${saturation}%, ${lightness}%, ${alpha})`;
            ctx.beginPath();

            for (let i = bandStart + 1; i < bandEnd; i++) {
                const prevIdx = ((start + i - 1) % maxTrailPoints) * 3;
                const currIdx = ((start + i) % maxTrailPoints) * 3;

                const p1x = points[prevIdx];
                const p1y = points[prevIdx + 1];
                const p1z = points[prevIdx + 2];
                const p2x = points[currIdx];
                const p2y = points[currIdx + 1];
                const p2z = points[currIdx + 2];

                const y1_rot = p1y * cos - p1z * sin;
                const y2_rot = p2y * cos - p2z * sin;

                const x1 = offsetX + p1x * scale * scaleX;
                const y1 = offsetY - y1_rot * scale;
                const x2 = offsetX + p2x * scale * scaleX;
                const y2 = offsetY - y2_rot * scale;

                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }

            ctx.stroke();
        }
    }

    function animate() {
        for (let i = 0; i < props.speed; i++) {
            lorenzStep();
        }
        draw();
        animationId = requestAnimationFrame(animate);
    }

    animate();
});

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});
</script>

<template>
    <canvas ref="canvas" class="lorenz-canvas"></canvas>
</template>

<style scoped>
.lorenz-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    pointer-events: none;
    will-change: contents;
}
</style>
