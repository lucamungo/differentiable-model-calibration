<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  // Position: fraction of canvas (0.5 = centered)
  centerXFraction: { type: Number, default: 0.5 },
  centerYFraction: { type: Number, default: 0.5 },
  // Size: multiplier for spinner radius (1.0 = fit to canvas)
  scale: { type: Number, default: 1.5 },
  nRings: { type: Number, default: 50 },
  lobes: { type: Number, default: 6 },
  innerR: { type: Number, default: 0.15 },
  outerR: { type: Number, default: 1 },
  dotSize: { type: Number, default: 2 },
  fixedDist: { type: Number, default: 0.02 },
  minPoints: { type: Number, default: 80 },
  dt: { type: Number, default: 0.03 },
  omegaInner: { type: Number, default: 0.15 },
  omegaOuter: { type: Number, default: 0.05 },
  shapeAmplitude: { type: Number, default: 0.03 },
  backgroundFade: { type: Number, default: 1 },
  hueStart: { type: Number, default: 212 },
  hueEnd: { type: Number, default: 212 },
  saturation: { type: Number, default: 96 },
  lightness: { type: Number, default: 78 },
  alpha: { type: Number, default: 0.85 }
});

const canvas = ref(null);
let animationId = null;

const settings = props;

const rings = [];
let ctx;
// Use fixed dimensions matching Slidev's internal slide size
const width = 980;
const height = 552;
let centerX = 0;
let centerY = 0;
let radialScale = 1;
let frame = 0;

function shape(theta) {
  return 1 + settings.shapeAmplitude * Math.cos(settings.lobes * theta);
}

function buildRings() {
  rings.length = 0;
  const {
    nRings,
    innerR,
    outerR,
    omegaInner,
    omegaOuter,
    fixedDist,
    minPoints,
    hueStart,
    hueEnd,
    saturation,
    lightness,
    alpha
  } = settings;

  for (let i = 0; i < nRings; i++) {
    const s = nRings === 1 ? 0 : i / (nRings - 1);
    const r0 = innerR + (outerR - innerR) * s;
    const circumference = 2 * Math.PI * r0;
    const pointCount = Math.max(minPoints, Math.floor(circumference / fixedDist));

    const theta = new Float32Array(pointCount);
    const radii = new Float32Array(pointCount);

    for (let j = 0; j < pointCount; j++) {
      const angle = (j / pointCount) * Math.PI * 2;
      theta[j] = angle;
      radii[j] = r0 * shape(angle);
    }

    const hue = hueStart + (hueEnd - hueStart) * s;

    rings.push({
      theta,
      radii,
      omega: omegaInner + (omegaOuter - omegaInner) * s,
      color: `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
    });
  }
}

function initCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl || !ctx) return;

  // Use fixed canvas buffer size, let CSS handle display scaling
  const pixelRatio = 2; // Use 2x for crisp rendering
  canvasEl.width = width * pixelRatio;
  canvasEl.height = height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  centerX = width * settings.centerXFraction;
  centerY = height * settings.centerYFraction;
  const margin = 0.9;
  const outerEnvelope = settings.outerR * 1.05;
  radialScale = ((Math.min(width, height) / 2) * margin * settings.scale) / outerEnvelope;
}

function drawFrame() {
  const t = frame * settings.dt;

  ctx.fillStyle = `rgba(251, 252, 255, ${settings.backgroundFade})`;
  ctx.fillRect(0, 0, width, height);

  const dotHalf = settings.dotSize / 2;

  rings.forEach((ring) => {
    const theta = ring.theta;
    const radii = ring.radii;
    const rotation = ring.omega * t;

    ctx.fillStyle = ring.color;

    for (let i = 0; i < theta.length; i++) {
      const angle = theta[i] + rotation;
      const radius = radii[i] * radialScale;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.fillRect(x - dotHalf, y - dotHalf, settings.dotSize, settings.dotSize);
    }
  });

  frame += 1;
}

function animate() {
  drawFrame();
  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  ctx = canvasEl.getContext("2d");
  buildRings();
  initCanvas();

  ctx.fillStyle = "rgba(251, 252, 255, 1)";
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
  <canvas ref="canvas" class="spinner-canvas"></canvas>
</template>

<style scoped>
.spinner-canvas {
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
