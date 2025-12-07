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
  trailLength: 5000,  // Reduced for performance
  backgroundFade: 0.08,
  hueStart: 212,
  hueEnd: 212,
  saturation: 96,
  lightness: 78,
  maxOpacity: 0.85,
  numBands: 20  // Number of batched draw calls
};

// Animation state
let currentStep = 0;
let drawScale = 1;
let corners = [];

// Use a ring buffer instead of array.shift() to avoid GC pauses
let segments = null;
let segmentHead = 0;
let segmentCount = 0;

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
  // Pre-allocate ring buffer with fixed size (4 floats per segment: x1, y1, x2, y2)
  segments = new Float32Array(settings.trailLength * 4);
  segmentHead = 0;
  segmentCount = 0;
}

// Add a segment to the ring buffer
function addSegment(x1, y1, x2, y2) {
  const idx = segmentHead * 4;
  segments[idx] = x1;
  segments[idx + 1] = y1;
  segments[idx + 2] = x2;
  segments[idx + 3] = y2;
  segmentHead = (segmentHead + 1) % settings.trailLength;
  if (segmentCount < settings.trailLength) segmentCount++;
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
  const topLeft = corners[0];
  const bottomRight = corners[1];

  for (let i = 0; i < settings.stepsPerFrame; i++) {
    const tlStart = calculatePoint(currentStep, topLeft.offsetX, topLeft.offsetY);
    currentStep++;
    const tlEnd = calculatePoint(currentStep, topLeft.offsetX, topLeft.offsetY);
    addSegment(tlStart.x, tlStart.y, tlEnd.x, tlEnd.y);

    const brStart = calculatePoint(currentStep - 1, bottomRight.offsetX, bottomRight.offsetY);
    const brEnd = calculatePoint(currentStep, bottomRight.offsetX, bottomRight.offsetY);
    addSegment(brStart.x, brStart.y, brEnd.x, brEnd.y);
  }
}

function draw() {
  ctx.fillStyle = `rgba(251, 252, 255, ${settings.backgroundFade})`;
  ctx.fillRect(0, 0, width, height);

  if (segmentCount < 2) return;

  ctx.lineWidth = settings.lineWidth;
  ctx.lineCap = "round";

  const start = segmentCount < settings.trailLength ? 0 : segmentHead;
  const bandSize = Math.ceil(segmentCount / settings.numBands);

  // Draw segments in batches by opacity band
  for (let band = 0; band < settings.numBands; band++) {
    const bandStart = band * bandSize;
    const bandEnd = Math.min((band + 1) * bandSize, segmentCount);

    if (bandStart >= segmentCount) break;

    // Calculate opacity for this band (middle of band)
    const midPoint = (bandStart + bandEnd) / 2;
    const progress = midPoint / segmentCount;
    const opacity = Math.min(progress * settings.maxOpacity, settings.maxOpacity);

    ctx.strokeStyle = `hsla(${settings.hueStart}, ${settings.saturation}%, ${settings.lightness}%, ${opacity})`;
    ctx.beginPath();

    for (let i = bandStart; i < bandEnd; i++) {
      const bufferIdx = ((start + i) % settings.trailLength) * 4;
      ctx.moveTo(segments[bufferIdx], segments[bufferIdx + 1]);
      ctx.lineTo(segments[bufferIdx + 2], segments[bufferIdx + 3]);
    }

    ctx.stroke();
  }
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
  will-change: contents;
}
</style>
