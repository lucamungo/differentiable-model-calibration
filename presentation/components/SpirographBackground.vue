<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

const canvas = ref(null);
let animationId = null;
let ctx = null;

// Use fixed dimensions matching Slidev's internal slide size
const width = 980;
const height = 552;

// Spirograph parameters (from the notebook)
const r = 4.0;
const r_x = 2.0;
const r_y = 2.0;
const pdiff = 75;
const scale = 10000;

// Visual settings (harmonized with SpinnerBackground)
const settings = {
  lineWidth: 1.5,
  stepsPerFrame: 5,
  trailLength: 11000,
  backgroundFade: 0.08,
  hueStart: 212,
  hueEnd: 212,
  saturation: 96,
  lightness: 78,
  maxOpacity: 0.85
};

// Animation state
let currentStep = 0;
let segments = [];
let drawScale = 1;
let corners = [];

function initCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  // Use fixed canvas buffer size, let CSS handle display scaling
  const pixelRatio = 2; // Use 2x for crisp rendering
  canvasEl.width = width * pixelRatio;
  canvasEl.height = height * pixelRatio;

  ctx = canvasEl.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  // Position spirographs at corners
  drawScale = Math.min(width, height) / 8;
  corners = [
    { offsetX: 0, offsetY: 0 },
    { offsetX: width, offsetY: height }
  ];
}

function resetAnimation() {
  currentStep = 0;
  segments = [];
}

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
  for (let i = 0; i < settings.stepsPerFrame; i++) {
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

  while (segments.length > settings.trailLength) {
    segments.shift();
  }
}

function draw() {
  ctx.fillStyle = `rgba(251, 252, 255, ${settings.backgroundFade})`;
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = settings.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  segments.forEach((seg, index) => {
    const progress = segments.length ? index / segments.length : 0;
    const hue = settings.hueStart + (settings.hueEnd - settings.hueStart) * progress;
    const opacity = Math.min(progress * settings.maxOpacity, settings.maxOpacity);
    ctx.strokeStyle = `hsla(${hue}, ${settings.saturation}%, ${settings.lightness}%, ${opacity})`;

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

onMounted(() => {
  if (!canvas.value) return;
  initCanvas();
  resetAnimation();

  // Initial clear
  ctx.fillStyle = "rgba(251, 252, 255, 1)";
  ctx.fillRect(0, 0, width, height);

  animate();
});

onActivated(() => {
  // Restart the animation when navigating back to the slide
  resetAnimation();
  if (ctx) {
    ctx.fillStyle = "rgba(251, 252, 255, 1)";
    ctx.fillRect(0, 0, width, height);
  }
  if (!animationId) {
    animate();
  }
});

onDeactivated(() => {
  // Stop the animation when leaving the slide
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
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
