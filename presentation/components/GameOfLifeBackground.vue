<script setup>
import { ref, onMounted, onUnmounted, onActivated } from "vue";

const props = defineProps({
  seedText: { type: String, default: null }
});

const canvas = ref(null);
let animationId = null;
let rngState = 0;

function seededRandom() {
  rngState += 0x6D2B79F5;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getRandom() {
  return props.seedText !== null ? seededRandom() : Math.random();
}

const settings = {
  cellSize: 4,
  density: 0.45,
  stepsPerFrame: 2,
  maxStableSteps: 2,
  minLiveCells: 50,
  reseedInterval: 2400
};

// Colors (RGB values)
const aliveR = 147, aliveG = 197, aliveB = 253;
const bgR = 251, bgG = 252, bgB = 255;

let ctx;
const width = 980;
const height = 552;
let cols = 0;
let rows = 0;
let bufferA;
let bufferB;
let current;
let next;
let stableSteps = 0;
let framesSinceReset = 0;

// Offscreen canvas at 1:1 cell-to-pixel ratio
let offscreen = null;
let offCtx = null;
let offImageData = null;
let offPixels = null;

function initCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const pixelRatio = 2;
  canvasEl.width = width * pixelRatio;
  canvasEl.height = height * pixelRatio;

  ctx = canvasEl.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  // Disable smoothing for crisp pixel scaling
  ctx.imageSmoothingEnabled = false;

  cols = Math.ceil(width / settings.cellSize);
  rows = Math.ceil(height / settings.cellSize);

  // Create tiny offscreen canvas (1 pixel per cell)
  offscreen = document.createElement("canvas");
  offscreen.width = cols;
  offscreen.height = rows;
  offCtx = offscreen.getContext("2d");
  offImageData = offCtx.createImageData(cols, rows);
  offPixels = new Uint32Array(offImageData.data.buffer);
}

function initializeGrid() {
  const size = cols * rows;
  bufferA = new Uint8Array(size);
  bufferB = new Uint8Array(size);
  current = bufferA;
  next = bufferB;
  stableSteps = 0;
  framesSinceReset = 0;

  rngState = props.seedText !== null
    ? Math.abs(props.seedText.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0))
    : Math.floor(Math.random() * 0xFFFFFFFF);

  for (let i = 0; i < size; i++) {
    current[i] = getRandom() < settings.density ? 1 : 0;
  }
}

function swapBuffers() {
  const temp = current;
  current = next;
  next = temp;
}

function stepLife() {
  let changed = false;
  let liveCount = 0;

  for (let y = 0; y < rows; y++) {
    const up = (y - 1 + rows) % rows;
    const down = (y + 1) % rows;
    const yOffset = y * cols;
    const upOffset = up * cols;
    const downOffset = down * cols;

    for (let x = 0; x < cols; x++) {
      const left = (x - 1 + cols) % cols;
      const right = (x + 1) % cols;

      const neighbors =
        current[upOffset + left] +
        current[upOffset + x] +
        current[upOffset + right] +
        current[yOffset + left] +
        current[yOffset + right] +
        current[downOffset + left] +
        current[downOffset + x] +
        current[downOffset + right];

      const idx = yOffset + x;
      const alive = current[idx];
      const nextAlive = neighbors === 3 || (alive && neighbors === 2) ? 1 : 0;
      next[idx] = nextAlive;
      if (nextAlive !== alive) changed = true;
      if (nextAlive) liveCount++;
    }
  }

  swapBuffers();
  return { changed, liveCount };
}

// Pre-compute RGBA colors as 32-bit integers (ABGR format for little-endian)
const bgColor = (255 << 24) | (bgB << 16) | (bgG << 8) | bgR;
const aliveColor = (230 << 24) | (aliveB << 16) | (aliveG << 8) | aliveR;

function draw() {
  const size = cols * rows;

  // Write directly to Uint32Array (4x faster than byte-by-byte)
  for (let i = 0; i < size; i++) {
    offPixels[i] = current[i] ? aliveColor : bgColor;
  }

  // Put the tiny image and scale it up
  offCtx.putImageData(offImageData, 0, 0);
  ctx.drawImage(offscreen, 0, 0, width, height);
}

function animate() {
  let anyChange = false;
  let liveCount = 0;

  for (let i = 0; i < settings.stepsPerFrame; i++) {
    const result = stepLife();
    anyChange = result.changed || anyChange;
    liveCount = result.liveCount;
  }

  framesSinceReset += 1;

  if (!anyChange || liveCount <= settings.minLiveCells || framesSinceReset >= settings.reseedInterval) {
    stableSteps += 1;
    if (stableSteps >= settings.maxStableSteps || liveCount <= settings.minLiveCells || framesSinceReset >= settings.reseedInterval) {
      initializeGrid();
    }
  } else {
    stableSteps = 0;
  }

  draw();
  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvas.value) return;
  initCanvas();
  initializeGrid();
  draw();
  animate();
});

onActivated(() => {
  initializeGrid();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <canvas ref="canvas" class="life-canvas"></canvas>
</template>

<style scoped>
.life-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -10;
  pointer-events: none;
  will-change: contents;
  image-rendering: pixelated;
}
</style>
