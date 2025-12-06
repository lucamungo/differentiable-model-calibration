<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

const props = defineProps({
  seedText: {
    type: String,
    default: "MACROCOSM"
  },
  textX: {
    type: Number,
    default: 0.5 // 0 = left, 0.5 = center, 1 = right
  },
  textY: {
    type: Number,
    default: 0.5 // 0 = top, 0.5 = center, 1 = bottom
  },
  holdFrames: {
    type: Number,
    default: 120 // Number of frames to hold the initial pattern before animating
  }
});

const canvas = ref(null);
let animationId = null;
let rngState = 0;

// Hash a string to a number
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Simple seeded PRNG (mulberry32)
function seededRandom() {
  rngState += 0x6D2B79F5;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getRandom() {
  return seededRandom();
}

const settings = {
  cellSize: 4,
  aliveColor: "rgba(147, 197, 253, 0.9)",
  fadeColor: "rgba(251, 252, 255, 1)",
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

let ctx;
// Use fixed dimensions matching Slidev's internal slide size
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

function initCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  // Use fixed canvas buffer size, let CSS handle display scaling
  const pixelRatio = 2; // Use 2x for crisp rendering
  canvasEl.width = width * pixelRatio;
  canvasEl.height = height * pixelRatio;

  ctx = canvasEl.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  cols = Math.ceil(width / settings.cellSize);
  rows = Math.ceil(height / settings.cellSize);
}

function renderTextPattern() {
  const size = cols * rows;
  if (!size) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = cols;
  offscreen.height = rows;
  const offCtx = offscreen.getContext("2d");
  offCtx.clearRect(0, 0, cols, rows);

  let fontSize = rows * settings.textScale;
  offCtx.textBaseline = "middle";
  offCtx.textAlign = "center";

  for (let i = 0; i < 5; i++) {
    offCtx.font = `900 ${fontSize}px ${settings.fontFamily}`;
    const metrics = offCtx.measureText(props.seedText);
    const targetWidth = cols * settings.textPaddingRatio;
    if (metrics.width <= targetWidth) {
      break;
    }
    const scale = targetWidth / metrics.width;
    fontSize *= scale;
  }

  offCtx.fillStyle = "white";
  offCtx.fillText(props.seedText, cols * props.textX, rows * props.textY);

  const image = offCtx.getImageData(0, 0, cols, rows).data;
  textPattern = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const alpha = image[i * 4 + 3] / 255;
    textPattern[i] = alpha > 0.3 ? 1 : 0;
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

  // Reset RNG state with seed from seedText
  rngState = hashString(props.seedText);

  if (!textPattern || textPattern.length !== size) {
    renderTextPattern();
  }

  for (let i = 0; i < size; i++) {
    const inText = textPattern ? textPattern[i] : 0;
    let alive = 0;
    if (inText) {
      alive = getRandom() < settings.textStrength ? 1 : 0;
      if (getRandom() < settings.textJitter) {
        alive = 0;
      }
    } else if (getRandom() < settings.noiseDensity) {
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

    for (let x = 0; x < cols; x++) {
      const left = (x - 1 + cols) % cols;
      const right = (x + 1) % cols;

      const idx = y * cols + x;

      let neighbors = 0;
      neighbors += current[up * cols + left];
      neighbors += current[up * cols + x];
      neighbors += current[up * cols + right];
      neighbors += current[y * cols + left];
      neighbors += current[y * cols + right];
      neighbors += current[down * cols + left];
      neighbors += current[down * cols + x];
      neighbors += current[down * cols + right];

      const alive = current[idx];
      const nextAlive = neighbors === 3 || (alive && neighbors === 2) ? 1 : 0;
      next[idx] = nextAlive;

      if (nextAlive !== alive) {
        changed = true;
      }
      if (nextAlive) {
        liveCount++;
      }
    }
  }

  swapBuffers();
  return { changed, liveCount };
}

function draw() {
  ctx.fillStyle = settings.fadeColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = settings.aliveColor;
  const size = settings.cellSize;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      if (!current[idx]) continue;
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
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
  // Restart the animation when navigating back to the slide
  initializeGrid();
  draw();
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
}
</style>
