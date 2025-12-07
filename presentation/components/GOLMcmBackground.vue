<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

const props = defineProps({
  seedText: { type: String, default: "MACROCOSM" },
  textX: { type: Number, default: 0.5 },
  textY: { type: Number, default: 0.5 },
  holdFrames: { type: Number, default: 120 }
});

const canvas = ref(null);
let animationId = null;
let rngState = 0;

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom() {
  rngState += 0x6D2B79F5;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const settings = {
  cellSize: 4,
  stepsPerFrame: 2,
  maxStableSteps: 160,
  minLiveCells: 60,
  reseedInterval: 2000,
  textScale: 0.35,
  fontFamily: '"Newsreader", "Inter", "Segoe UI", sans-serif',
  textStrength: 1,
  textJitter: 0,
  noiseDensity: 0.05,
  textPaddingRatio: 0.65
};

// Colors (RGB values)
const aliveR = 147, aliveG = 197, aliveB = 253;
const bgR = 251, bgG = 252, bgB = 255;

// Pre-compute RGBA colors as 32-bit integers (ABGR format for little-endian)
const bgColor = (255 << 24) | (bgB << 16) | (bgG << 8) | bgR;
const aliveColor = (230 << 24) | (aliveB << 16) | (aliveG << 8) | aliveR;

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
let textPattern = null;

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

function renderTextPattern() {
  const size = cols * rows;
  if (!size) return;

  const textCanvas = document.createElement("canvas");
  textCanvas.width = cols;
  textCanvas.height = rows;
  const textCtx = textCanvas.getContext("2d");
  textCtx.clearRect(0, 0, cols, rows);

  let fontSize = rows * settings.textScale;
  textCtx.textBaseline = "middle";
  textCtx.textAlign = "center";

  for (let i = 0; i < 5; i++) {
    textCtx.font = `900 ${fontSize}px ${settings.fontFamily}`;
    const metrics = textCtx.measureText(props.seedText);
    const targetWidth = cols * settings.textPaddingRatio;
    if (metrics.width <= targetWidth) break;
    fontSize *= targetWidth / metrics.width;
  }

  textCtx.fillStyle = "white";
  textCtx.fillText(props.seedText, cols * props.textX, rows * props.textY);

  const image = textCtx.getImageData(0, 0, cols, rows).data;
  textPattern = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    textPattern[i] = image[i * 4 + 3] > 76 ? 1 : 0; // ~0.3 threshold
  }
}

function initializeGrid() {
  const size = cols * rows;
  bufferA = new Uint8Array(size);
  bufferB = new Uint8Array(size);
  current = bufferA;
  next = bufferB;
  stableSteps = 0;
  framesSinceReset = 0;

  rngState = hashString(props.seedText);

  if (!textPattern || textPattern.length !== size) {
    renderTextPattern();
  }

  for (let i = 0; i < size; i++) {
    const inText = textPattern ? textPattern[i] : 0;
    let alive = 0;
    if (inText) {
      alive = seededRandom() < settings.textStrength ? 1 : 0;
      if (seededRandom() < settings.textJitter) alive = 0;
    } else if (seededRandom() < settings.noiseDensity) {
      alive = 1;
    }
    current[i] = alive;
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
  if (framesSinceReset < props.holdFrames) {
    framesSinceReset += 1;
    draw();
    animationId = requestAnimationFrame(animate);
    return;
  }

  let anyChange = false;
  let liveCount = 0;

  for (let i = 0; i < settings.stepsPerFrame; i++) {
    const result = stepLife();
    anyChange = result.changed || anyChange;
    liveCount = result.liveCount;
  }

  framesSinceReset += 1;

  const shouldReseed =
    !anyChange ||
    liveCount <= settings.minLiveCells ||
    framesSinceReset >= settings.reseedInterval;

  if (shouldReseed) {
    stableSteps += 1;
    if (
      stableSteps >= settings.maxStableSteps ||
      liveCount <= settings.minLiveCells ||
      framesSinceReset >= settings.reseedInterval
    ) {
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
  renderTextPattern();
  initializeGrid();
  draw();
  animate();
});

onActivated(() => {
  initializeGrid();
  draw();
  if (!animationId) animate();
});

onDeactivated(() => {
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
