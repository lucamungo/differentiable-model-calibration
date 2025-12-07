<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

const canvas = ref(null);
let animationId = null;
let ctx = null;

const width = 980;
const height = 552;

const settings = {
  cubeSize: 200,
  pyramidSize: 120,
  dodecahedronSize: 200,
  rotationSpeed: 0.02,
  lineWidth: 2,
  hue: 212,
  saturation: 90,
  lightness: 60,
  alpha: 0.9,
  cubeX: 0.15,
  cubeY: 0.15,
  pyramidX: 0.5,
  pyramidY: 0.5,
  dodecahedronX: 0.85,
  dodecahedronY: 0.85,
  focalLength: 400
};

// Animation state
let cubeAngleX = 0, cubeAngleY = 0, cubeAngleZ = 0;
let pyramidAngleX = 0, pyramidAngleY = 0, pyramidAngleZ = 0;
let dodecahedronAngleX = 0, dodecahedronAngleY = 0, dodecahedronAngleZ = 0;

// Pre-computed vertices (created once)
let cubeVerts = null;
let pyramidVerts = null;
let dodecaVerts = null;

// Pre-allocated projection buffers (reused every frame)
let cubeProj = null;
let pyramidProj = null;
let dodecaProj = null;

const cubeEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

const pyramidEdges = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [2, 3], [3, 4], [4, 1]
];

const dodecahedronEdges = [
  [0, 8], [0, 12], [0, 16], [1, 9], [1, 12], [1, 17],
  [2, 10], [2, 13], [2, 16], [3, 11], [3, 13], [3, 17],
  [4, 8], [4, 14], [4, 18], [5, 9], [5, 14], [5, 19],
  [6, 10], [6, 15], [6, 18], [7, 11], [7, 15], [7, 19],
  [8, 10], [9, 11], [12, 14], [13, 15], [16, 17], [18, 19]
];

function initGeometry() {
  // Cube vertices
  const cs = settings.cubeSize / 2;
  cubeVerts = new Float32Array([
    -cs, -cs, -cs, cs, -cs, -cs, cs, cs, -cs, -cs, cs, -cs,
    -cs, -cs, cs, cs, -cs, cs, cs, cs, cs, -cs, cs, cs
  ]);
  cubeProj = new Float32Array(16); // 8 vertices * 2 (x, y)

  // Pyramid vertices
  const ps = settings.pyramidSize / 2;
  const ph = settings.pyramidSize * 0.8 / 2;
  pyramidVerts = new Float32Array([
    0, -ph, 0, -ps, ph, -ps, ps, ph, -ps, ps, ph, ps, -ps, ph, ps
  ]);
  pyramidProj = new Float32Array(10); // 5 vertices * 2

  // Dodecahedron vertices
  const ds = settings.dodecahedronSize / 2;
  const phi = (1 + Math.sqrt(5)) / 2;
  const inv = 1 / phi;
  const rawDodeca = [
    1, 1, 1, 1, 1, -1, 1, -1, 1, 1, -1, -1,
    -1, 1, 1, -1, 1, -1, -1, -1, 1, -1, -1, -1,
    0, inv, phi, 0, inv, -phi, 0, -inv, phi, 0, -inv, -phi,
    inv, phi, 0, inv, -phi, 0, -inv, phi, 0, -inv, -phi, 0,
    phi, 0, inv, phi, 0, -inv, -phi, 0, inv, -phi, 0, -inv
  ];
  dodecaVerts = new Float32Array(rawDodeca.map(v => v * ds));
  dodecaProj = new Float32Array(40); // 20 vertices * 2
}

function transformAndProject(verts, proj, centerX, centerY, ax, ay, az) {
  const cosX = Math.cos(ax), sinX = Math.sin(ax);
  const cosY = Math.cos(ay), sinY = Math.sin(ay);
  const cosZ = Math.cos(az), sinZ = Math.sin(az);
  const focal = settings.focalLength;

  const numVerts = verts.length / 3;
  for (let i = 0; i < numVerts; i++) {
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

    // Project
    const scale = focal / (focal + z2);
    proj[i * 2] = centerX + x3 * scale;
    proj[i * 2 + 1] = centerY + y3 * scale;
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
  cubeAngleX = cubeAngleY = cubeAngleZ = 0;
  pyramidAngleX = pyramidAngleY = pyramidAngleZ = 0;
  dodecahedronAngleX = dodecahedronAngleY = dodecahedronAngleZ = 0;
}

function draw() {
  ctx.fillStyle = "rgba(251, 252, 255, 1)";
  ctx.fillRect(0, 0, width, height);

  // Transform all shapes
  transformAndProject(cubeVerts, cubeProj, width * settings.cubeX, height * settings.cubeY, cubeAngleX, cubeAngleY, cubeAngleZ);
  transformAndProject(pyramidVerts, pyramidProj, width * settings.pyramidX, height * settings.pyramidY, pyramidAngleX, pyramidAngleY, pyramidAngleZ);
  transformAndProject(dodecaVerts, dodecaProj, width * settings.dodecahedronX, height * settings.dodecahedronY, dodecahedronAngleX, dodecahedronAngleY, dodecahedronAngleZ);

  // Draw all edges in a single batched path
  ctx.strokeStyle = `hsla(${settings.hue}, ${settings.saturation}%, ${settings.lightness}%, ${settings.alpha})`;
  ctx.lineWidth = settings.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  // Cube edges
  for (const [i, j] of cubeEdges) {
    ctx.moveTo(cubeProj[i * 2], cubeProj[i * 2 + 1]);
    ctx.lineTo(cubeProj[j * 2], cubeProj[j * 2 + 1]);
  }

  // Pyramid edges
  for (const [i, j] of pyramidEdges) {
    ctx.moveTo(pyramidProj[i * 2], pyramidProj[i * 2 + 1]);
    ctx.lineTo(pyramidProj[j * 2], pyramidProj[j * 2 + 1]);
  }

  // Dodecahedron edges
  for (const [i, j] of dodecahedronEdges) {
    ctx.moveTo(dodecaProj[i * 2], dodecaProj[i * 2 + 1]);
    ctx.lineTo(dodecaProj[j * 2], dodecaProj[j * 2 + 1]);
  }

  ctx.stroke();
}

function animate() {
  const speed = settings.rotationSpeed;

  cubeAngleX += speed * 0.8;
  cubeAngleY += speed * 1.0;
  cubeAngleZ += speed * 0.3;

  pyramidAngleX += speed * 0.2;
  pyramidAngleY += speed * 2.0;
  pyramidAngleZ += speed * 0.1;

  dodecahedronAngleX += speed * 0.6;
  dodecahedronAngleY += speed * 0.4;
  dodecahedronAngleZ += speed * 0.9;

  draw();
  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvas.value) return;
  initCanvas();
  initGeometry();
  resetAnimation();
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
  <canvas ref="canvas" class="wireframe-canvas"></canvas>
</template>

<style scoped>
.wireframe-canvas {
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
