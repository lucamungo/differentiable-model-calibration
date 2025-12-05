<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let animationId = null;

// Spirograph parameters (from the notebook)
const r = 4.0;
const r_x = 2.0;
const r_y = 2.0;
const pdiff = 75;
const scale = 10000;

// Visual settings (harmonized with Lorenz background)
const lineWidth = 1.5;
const stepsPerFrame = 5; // How many points to draw per frame
const trailLength = 11000; // How many segments to keep in the trail
const backgroundFade = 0.08; // Fade previous frame instead of hard clearing
const baseHue = 180; // Cyan/blue palette like Lorenz background
const hueRange = 50;
const saturation = 70;
const lightness = 60;
const maxOpacity = 0.85;

// Animation state
let currentStep = 0;
const segments = [];

onMounted(() => {
  const ctx = canvas.value.getContext("2d");
  const width = (canvas.value.width = window.innerWidth);
  const height = (canvas.value.height = window.innerHeight);

  // Position spirographs at corners
  const drawScale = Math.min(width, height) / 8; // Scale to fit screen
  const corners = [
    { offsetX: 0, offsetY: 0 },
    { offsetX: width, offsetY: height }
  ];

  function calculatePoint(step, offsetX, offsetY) {
    const theta = (step / scale) * 2 * Math.PI;

    const x = r * Math.cos(theta) + r_x * Math.cos(pdiff * theta);
    const y = r * Math.sin(theta) + r_y * Math.sin(pdiff * theta);

    return {
      x: offsetX + x * drawScale,
      y: offsetY + y * drawScale
    };
  }

  function stepSpirograph() {
    for (let i = 0; i < stepsPerFrame; i++) {
      const [topLeft, bottomRight] = corners;
      const tlStart = calculatePoint(currentStep, topLeft.offsetX, topLeft.offsetY);
      currentStep++;
      const tlEnd = calculatePoint(currentStep, topLeft.offsetX, topLeft.offsetY);

      segments.push({
        x1: tlStart.x,
        y1: tlStart.y,
        x2: tlEnd.x,
        y2: tlEnd.y
      });

      const brStart = calculatePoint(currentStep - 1, bottomRight.offsetX, bottomRight.offsetY);
      const brEnd = calculatePoint(currentStep, bottomRight.offsetX, bottomRight.offsetY);

      segments.push({
        x1: brStart.x,
        y1: brStart.y,
        x2: brEnd.x,
        y2: brEnd.y
      });
    }

    while (segments.length > trailLength) {
      segments.shift();
    }
  }

  function draw() {
    ctx.fillStyle = `rgba(0, 0, 0, ${backgroundFade})`;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    segments.forEach((seg, index) => {
      const progress = segments.length ? index / segments.length : 0;
      const hue = baseHue + (progress - 0.5) * hueRange;
      const opacity = Math.min(progress * maxOpacity, maxOpacity);
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;

      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    });
  }

  function animate() {
    stepSpirograph();
    draw();
    animationId = requestAnimationFrame(animate);
  }

  // Initial clear
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, width, height);

  animate();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <canvas ref="canvas" class="spirograph-canvas"></canvas>
</template>

<style scoped>
.spirograph-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -10;
  pointer-events: none;
}
</style>
