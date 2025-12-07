<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

// Each pot in the pots array can have:
// - posX, posY: position as fraction of canvas (0-1)
// - scale: size of the pot
// - rotationSpeedX, rotationSpeedY, rotationSpeedZ: angular velocities for each axis
// - initialAngleX, initialAngleY, initialAngleZ: starting angles
const props = defineProps({
  pots: {
    type: Array,
    default: () => [{ posX: 0.75, posY: 0.5, scale: 200, rotationSpeedX: 0, rotationSpeedY: 0.03, rotationSpeedZ: 0 }]
  },
  lineWidth: { type: Number, default: 1.2 },
  hue: { type: Number, default: 212 },
  saturation: { type: Number, default: 90 },
  lightness: { type: Number, default: 60 },
  alpha: { type: Number, default: 0.8 },
  focalLength: { type: Number, default: 600 }
});

const canvas = ref(null);
let animationId = null;
let ctx = null;

const width = 980;
const height = 552;

// Pre-computed geometry per pot
let potData = [];

// Generate edges once (same for all pots)
function getMokaEdges() {
  const edges = [];
  function addRingEdges(startIdx) {
    for (let i = 0; i < 8; i++) {
      edges.push([startIdx + i, startIdx + ((i + 1) % 8)]);
    }
  }
  function addVerticalEdges(level1Start, level2Start) {
    for (let i = 0; i < 8; i++) {
      edges.push([level1Start + i, level2Start + i]);
    }
  }

  addRingEdges(0); addRingEdges(8); addVerticalEdges(0, 8);
  addRingEdges(16); addVerticalEdges(8, 16);
  addRingEdges(24); addRingEdges(32); addVerticalEdges(16, 24); addVerticalEdges(24, 32);
  addRingEdges(40); addRingEdges(48); addVerticalEdges(32, 40); addVerticalEdges(40, 48);
  addRingEdges(56); addRingEdges(64); addVerticalEdges(48, 56); addVerticalEdges(56, 64);
  for (let i = 0; i < 8; i++) edges.push([64 + i, 72]);
  edges.push([73, 74], [74, 75], [76, 77], [77, 78], [73, 76], [75, 78]);
  edges.push([73, 8], [76, 16], [75, 32], [78, 32]);
  edges.push([79, 35], [79, 36], [79, 80], [80, 35], [80, 36]);

  return edges;
}

const mokaEdges = getMokaEdges();
const numVertices = 81; // 72 octagon + 1 apex + 6 handle + 2 spout

function createMokaVertices(s) {
  const verts = new Float32Array(numVertices * 3);
  let idx = 0;

  // Helper to add octagon ring
  function addOctagonRing(y, radius) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      verts[idx++] = Math.cos(angle) * radius;
      verts[idx++] = y;
      verts[idx++] = Math.sin(angle) * radius;
    }
  }

  addOctagonRing(-s * 1.2, s * 0.7);    // 0-7
  addOctagonRing(-s * 0.2, s * 0.45);   // 8-15
  addOctagonRing(-s * 0.1, s * 0.45);   // 16-23
  addOctagonRing(s * 0.0, s * 0.45);    // 24-31
  addOctagonRing(s * 1.0, s * 0.65);    // 32-39
  addOctagonRing(s * 1.05, s * 0.6);    // 40-47
  addOctagonRing(s * 1.15, s * 0.05);   // 48-55
  addOctagonRing(s * 1.25, s * 0.06);   // 56-63
  addOctagonRing(s * 1.43, s * 0.09);   // 64-71

  // Knob apex (72)
  verts[idx++] = 0; verts[idx++] = s * 1.5; verts[idx++] = 0;

  // Handle outer (73-75)
  verts[idx++] = s * 0.5; verts[idx++] = -s * 0.1; verts[idx++] = 0;
  verts[idx++] = s * 0.85; verts[idx++] = s * 0.4; verts[idx++] = 0;
  verts[idx++] = s * 0.75; verts[idx++] = s * 0.9; verts[idx++] = 0;

  // Handle inner (76-78)
  verts[idx++] = s * 0.45; verts[idx++] = s * 0.0; verts[idx++] = 0;
  verts[idx++] = s * 0.65; verts[idx++] = s * 0.4; verts[idx++] = 0;
  verts[idx++] = s * 0.6; verts[idx++] = s * 0.8; verts[idx++] = 0;

  // Spout (79-80)
  verts[idx++] = -s * 0.9; verts[idx++] = s * 1.0; verts[idx++] = 0;
  verts[idx++] = -s * 0.55; verts[idx++] = s * 0.5; verts[idx++] = 0;

  return verts;
}

function initGeometry() {
  potData = props.pots.map(pot => ({
    vertices: createMokaVertices(pot.scale || 200),
    projected: new Float32Array(numVertices * 2),
    angleX: pot.initialAngleX || 0,
    angleY: pot.initialAngleY || 0,
    angleZ: pot.initialAngleZ || 0,
    centerX: width * (pot.posX || 0.5),
    centerY: height * (pot.posY || 0.5),
    rotationSpeedX: pot.rotationSpeedX || 0,
    rotationSpeedY: pot.rotationSpeedY || 0.03,
    rotationSpeedZ: pot.rotationSpeedZ || 0
  }));
}

function transformAndProject(verts, proj, centerX, centerY, ax, ay, az) {
  const cosX = Math.cos(ax), sinX = Math.sin(ax);
  const cosY = Math.cos(ay), sinY = Math.sin(ay);
  const cosZ = Math.cos(az), sinZ = Math.sin(az);
  const focal = props.focalLength;

  for (let i = 0; i < numVertices; i++) {
    let x = verts[i * 3];
    let y = verts[i * 3 + 1];
    let z = verts[i * 3 + 2];

    // Rotate X
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;

    // Rotate Y
    let x2 = x * cosY + z1 * sinY;
    let z2 = -x * sinY + z1 * cosY;

    // Rotate Z
    let x3 = x2 * cosZ - y1 * sinZ;
    let y3 = x2 * sinZ + y1 * cosZ;

    // Project (flip Y so up is positive)
    const scale = focal / (focal + z2);
    proj[i * 2] = centerX + x3 * scale;
    proj[i * 2 + 1] = centerY - y3 * scale;
  }
}

function initCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const pixelRatio = 2;
  canvasEl.width = width * pixelRatio;
  canvasEl.height = height * pixelRatio;

  ctx = canvasEl.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function resetAnimation() {
  potData.forEach((pot, i) => {
    const config = props.pots[i];
    pot.angleX = config.initialAngleX || 0;
    pot.angleY = config.initialAngleY || 0;
    pot.angleZ = config.initialAngleZ || 0;
  });
}

function draw() {
  ctx.fillStyle = "rgba(251, 252, 255, 1)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = `hsla(${props.hue}, ${props.saturation}%, ${props.lightness}%, ${props.alpha})`;
  ctx.lineWidth = props.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw all pots in a single batched path
  ctx.beginPath();

  for (const pot of potData) {
    transformAndProject(pot.vertices, pot.projected, pot.centerX, pot.centerY, pot.angleX, pot.angleY, pot.angleZ);

    for (const [i, j] of mokaEdges) {
      ctx.moveTo(pot.projected[i * 2], pot.projected[i * 2 + 1]);
      ctx.lineTo(pot.projected[j * 2], pot.projected[j * 2 + 1]);
    }
  }

  ctx.stroke();
}

function animate() {
  for (const pot of potData) {
    pot.angleX += pot.rotationSpeedX;
    pot.angleY += pot.rotationSpeedY;
    pot.angleZ += pot.rotationSpeedZ;
  }

  draw();
  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvas.value) return;
  initCanvas();
  initGeometry();
  draw();
  animate();
});

onActivated(() => {
  resetAnimation();
  if (ctx) draw();
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
  <canvas ref="canvas" class="moka-canvas"></canvas>
</template>

<style scoped>
.moka-canvas {
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
