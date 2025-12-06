<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let animationId = null;

const settings = {
  alpha: 1.1,
  beta: 0.4,
  gamma: 0.4,
  delta: 0.1,
  dt: 0.01,
  stepsPerFrame: 3,
  trajectories: 18,
  fade: 0.08,
  hueStart: 180,
  hueEnd: 240,
  saturation: 75,
  lightness: 60,
  minX: 0.1,
  maxX: 3.4,
  minY: 0.1,
  maxY: 3.4
};

const state = {
  ctx: null,
  width: 0,
  height: 0,
  trajectories: [],
  padding: 40
};

const handleResize = () => {
  if (!canvas.value) return;
  resizeCanvas();
  createTrajectories();
  state.ctx.fillStyle = "rgba(0, 0, 0, 1)";
  state.ctx.fillRect(0, 0, state.width, state.height);
};

function mapX(x) {
  const { minX, maxX } = settings;
  const usableW = state.width - state.padding * 2;
  return state.padding + ((x - minX) / (maxX - minX)) * usableW;
}

function mapY(y) {
  const { minY, maxY } = settings;
  const usableH = state.height - state.padding * 2;
  const rel = (y - minY) / (maxY - minY);
  return state.height - state.padding - rel * usableH;
}

function randomInitialCondition() {
  const x =
    settings.minX + Math.random() * (settings.maxX - settings.minX) * 0.9;
  const y =
    settings.minY + Math.random() * (settings.maxY - settings.minY) * 0.9;
  return { x, y };
}

function createTrajectories() {
  state.trajectories = Array.from({ length: settings.trajectories }, (_, i) => {
    const { x, y } = randomInitialCondition();
    const hue =
      settings.hueStart +
      ((settings.hueEnd - settings.hueStart) * i) / settings.trajectories;
    return { x, y, hue };
  });
}

function stepSystem(traj) {
  const { alpha, beta, gamma, delta, dt, minX, maxX, minY, maxY } = settings;
  let { x, y } = traj;
  let resetOccurred = false;

  for (let i = 0; i < settings.stepsPerFrame; i++) {
    const dx = alpha * x - beta * x * y;
    const dy = delta * x * y - gamma * y;
    x += dx * dt;
    y += dy * dt;

    if (
      x < minX ||
      x > maxX ||
      y < minY ||
      y > maxY ||
      !isFinite(x) ||
      !isFinite(y)
    ) {
      const reset = randomInitialCondition();
      x = reset.x;
      y = reset.y;
      resetOccurred = true;
    }
  }

  return { x, y, resetOccurred };
}

function resizeCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const rect =
    document.getElementById("slide-content")?.getBoundingClientRect() ??
    canvasEl.getBoundingClientRect();

  state.width = rect?.width * 1.5 || window.innerWidth;
  state.height = rect?.height * 1.5 || window.innerHeight;

  const pixelRatio = window.devicePixelRatio || 1;
  canvasEl.width = state.width * pixelRatio;
  canvasEl.height = state.height * pixelRatio;
  canvasEl.style.width = `${state.width}px`;
  canvasEl.style.height = `${state.height}px`;

  state.ctx = canvasEl.getContext("2d");
  state.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawFrame() {
  state.ctx.fillStyle = `rgba(0, 0, 0, ${settings.fade})`;
  state.ctx.fillRect(0, 0, state.width, state.height);

  state.ctx.lineWidth = 1.2;
  state.ctx.lineCap = "round";

  state.trajectories.forEach((traj) => {
    const startX = mapX(traj.x);
    const startY = mapY(traj.y);
    const { x, y, resetOccurred } = stepSystem(traj);
    traj.x = x;
    traj.y = y;

    if (!resetOccurred) {
      const endX = mapX(traj.x);
      const endY = mapY(traj.y);

      state.ctx.strokeStyle = `hsla(${traj.hue}, ${settings.saturation}%, ${settings.lightness}%, 0.85)`;
      state.ctx.beginPath();
      state.ctx.moveTo(startX, startY);
      state.ctx.lineTo(endX, endY);
      state.ctx.stroke();
    }
  });
}

function animate() {
  drawFrame();
  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvas.value) return;
  resizeCanvas();
  createTrajectories();
  state.ctx.fillStyle = "rgba(0, 0, 0, 1)";
  state.ctx.fillRect(0, 0, state.width, state.height);
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
  <canvas ref="canvas" class="lotka-canvas"></canvas>
</template>

<style scoped>
.lotka-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -10;
  pointer-events: none;
}
</style>
