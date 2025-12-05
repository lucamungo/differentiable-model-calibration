<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let animationId = null;

const settings = {
  cellSize: 6,
  aliveColor: "rgba(80, 180, 255, 0.9)",
  fadeColor: "rgba(0, 0, 0, 1)",
  stepsPerFrame: 1,
  maxStableSteps: 160,
  minLiveCells: 60,
  reseedInterval: 2000,
  seedText: "MACROCOSM",
  textScale: 0.35,
  fontFamily: '"Newsreader", "Inter", "Segoe UI", sans-serif',
  textStrength: 1,
  textJitter: 0,
  noiseDensity: 0.05,
  textPaddingRatio: 0.65,
  introHoldFrames: 45
};

let ctx;
let width = 0;
let height = 0;
let cols = 0;
let rows = 0;
let bufferA;
let bufferB;
let current;
let next;
let stableSteps = 0;
let framesSinceReset = 0;
let textPattern = null;

const handleResize = () => {
  if (!canvas.value) return;
  resizeCanvas();
  renderTextPattern();
  initializeGrid();
};

function resizeCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const slideEl = document.getElementById("slide-content");
  const rect = slideEl?.getBoundingClientRect() ?? canvasEl.getBoundingClientRect();
  width = rect?.width * 0.75 || window.innerWidth;
  height = rect?.height || window.innerHeight;

  const pixelRatio = window.devicePixelRatio || 1;
  canvasEl.width = width * 1 * pixelRatio;
  canvasEl.height = height * 1.5 * pixelRatio;
  canvasEl.style.width = `${width}px`;
  canvasEl.style.height = `${height}px`;

  ctx = canvasEl.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  cols = Math.max(20, Math.ceil(width / settings.cellSize));
  rows = Math.max(20, Math.ceil(height / settings.cellSize));
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
    const metrics = offCtx.measureText(settings.seedText);
    const targetWidth = cols * settings.textPaddingRatio;
    if (metrics.width <= targetWidth) {
      break;
    }
    const scale = targetWidth / metrics.width;
    fontSize *= scale;
  }

  offCtx.fillStyle = "white";
  offCtx.fillText(settings.seedText, cols / 2, rows / 2);

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

  if (!textPattern || textPattern.length !== size) {
    renderTextPattern();
  }

  for (let i = 0; i < size; i++) {
    const inText = textPattern ? textPattern[i] : 0;
    let alive = 0;
    if (inText) {
      alive = Math.random() < settings.textStrength ? 1 : 0;
      if (Math.random() < settings.textJitter) {
        alive = 0;
      }
    } else if (Math.random() < settings.noiseDensity) {
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
  if (framesSinceReset < settings.introHoldFrames) {
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
  resizeCanvas();
  renderTextPattern();
  initializeGrid();
  draw();
  animate();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
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
}
</style>
