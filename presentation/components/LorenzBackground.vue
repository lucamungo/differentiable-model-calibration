<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let animationId = null;

// Lorenz system parameters
const sigma = 10;
const rho = 28;
const beta = 8 / 3;
const dt = 0.001;
const stepsPerFrame = 100; // How many simulation steps per animation frame
const transparency = 0.5; // Overall transparency (0 = invisible, 1 = fully opaque)

// Color settings
const baseHue = 212; // Matches SpinnerBackground blue
const hueRange = 0; // No color variation (same as SpinnerBackground)
const saturation = 96; // Matches SpinnerBackground vividness
const lightness = 78; // Matches SpinnerBackground lightness

// Initial conditions
let x = 0.1;
let y = 0;
let z = 0;

// Trail of points
const points = [];
const maxTrailPoints = 25000; // How many points to show in the trail
const preComputeSteps = 0; // How many steps to pre-compute before starting

onMounted(() => {
    const ctx = canvas.value.getContext("2d");

    // High-DPI support for sharper rendering
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.value.width = width * dpr;
    canvas.value.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Scale and center the attractor
    const scale = 20;
    const scaleX = 1.8; // Stretch horizontally to separate wings
    const offsetX = width / 2;
    const offsetY = height / 2 + 530;

    function lorenzStep() {
        // Calculate derivatives
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;

        // Update position
        x += dx;
        y += dy;
        z += dz;

        // Store point
        points.push({ x, y, z });
        if (points.length > maxTrailPoints) {
            points.shift();
        }
    }

    // Pre-compute trajectory to start with full attractor visible
    for (let i = 0; i < preComputeSteps; i++) {
        lorenzStep();
    }

    function draw() {
        // Fade out previous frame for trail effect (light background)
        ctx.fillStyle = "rgba(251, 252, 255, 0.05)";
        ctx.fillRect(0, 0, width, height);

        // Draw the attractor
        ctx.strokeStyle = "#4CC9F0";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;

        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];

            // Rotate to get V-shape view (rotate around x-axis by ~30 degrees)
            const angle = -Math.PI / 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Apply rotation to make V-shape more visible
            const y1_rot = p1.y * cos - p1.z * sin;
            const z1_rot = p1.y * sin + p1.z * cos;
            const y2_rot = p2.y * cos - p2.z * sin;
            const z2_rot = p2.y * sin + p2.z * cos;

            // Map 3D to 2D (stretch x-axis to separate wings)
            const x1 = offsetX + p1.x * scale * scaleX;
            const y1 = offsetY - y1_rot * scale;
            const x2 = offsetX + p2.x * scale * scaleX;
            const y2 = offsetY - y2_rot * scale;

            // Color gradient based on z coordinate
            const hue = baseHue + (z2_rot / 50) * hueRange;
            const alpha = (i / maxTrailPoints) * transparency;
            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    function animate() {
        // Run multiple steps per frame for faster animation
        for (let i = 0; i < stepsPerFrame; i++) {
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
}
</style>
