<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

const canvas = ref(null);
let animationId = null;
let ctx = null;

// Use fixed dimensions matching Slidev's internal slide size
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
  // Positions (as fractions of width/height)
  cubeX: 0.15,
  cubeY: 0.15,
  pyramidX: 0.5,
  pyramidY: 0.5,
  dodecahedronX: 0.85,
  dodecahedronY: 0.85,
  // Camera distance for perspective
  focalLength: 400
};

// Animation state - separate angles for each shape
let cubeAngleX = 0;
let cubeAngleY = 0;
let cubeAngleZ = 0;

let pyramidAngleX = 0;
let pyramidAngleY = 0;
let pyramidAngleZ = 0;

let dodecahedronAngleX = 0;
let dodecahedronAngleY = 0;
let dodecahedronAngleZ = 0;

// Cube vertices (centered at origin)
function getCubeVertices(size) {
  const s = size / 2;
  return [
    [-s, -s, -s], // 0: back-bottom-left
    [s, -s, -s],  // 1: back-bottom-right
    [s, s, -s],   // 2: back-top-right
    [-s, s, -s],  // 3: back-top-left
    [-s, -s, s],  // 4: front-bottom-left
    [s, -s, s],   // 5: front-bottom-right
    [s, s, s],    // 6: front-top-right
    [-s, s, s]    // 7: front-top-left
  ];
}

// Cube edges (pairs of vertex indices)
const cubeEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0], // back face
  [4, 5], [5, 6], [6, 7], [7, 4], // front face
  [0, 4], [1, 5], [2, 6], [3, 7]  // connecting edges
];

// Pyramid vertices (centered at origin, base on XZ plane)
function getPyramidVertices(size) {
  const s = size / 2;
  const h = size * 0.8; // height
  return [
    [0, -h / 2, 0],      // 0: apex (top)
    [-s, h / 2, -s],     // 1: base back-left
    [s, h / 2, -s],      // 2: base back-right
    [s, h / 2, s],       // 3: base front-right
    [-s, h / 2, s]       // 4: base front-left
  ];
}

// Pyramid edges
const pyramidEdges = [
  [0, 1], [0, 2], [0, 3], [0, 4], // apex to base vertices
  [1, 2], [2, 3], [3, 4], [4, 1]  // base edges
];

// Dodecahedron vertices (using golden ratio)
function getDodecahedronVertices(size) {
  const scale = size / 2;
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618
  const invPhi = 1 / phi;

  // 20 vertices of a regular dodecahedron
  const vertices = [
    // 8 vertices: (±1, ±1, ±1)
    [1, 1, 1],
    [1, 1, -1],
    [1, -1, 1],
    [1, -1, -1],
    [-1, 1, 1],
    [-1, 1, -1],
    [-1, -1, 1],
    [-1, -1, -1],
    // 4 vertices: (0, ±1/φ, ±φ)
    [0, invPhi, phi],
    [0, invPhi, -phi],
    [0, -invPhi, phi],
    [0, -invPhi, -phi],
    // 4 vertices: (±1/φ, ±φ, 0)
    [invPhi, phi, 0],
    [invPhi, -phi, 0],
    [-invPhi, phi, 0],
    [-invPhi, -phi, 0],
    // 4 vertices: (±φ, 0, ±1/φ)
    [phi, 0, invPhi],
    [phi, 0, -invPhi],
    [-phi, 0, invPhi],
    [-phi, 0, -invPhi]
  ];

  return vertices.map(([x, y, z]) => [x * scale, y * scale, z * scale]);
}

// Dodecahedron edges (30 edges connecting the 20 vertices)
const dodecahedronEdges = [
  // Edges from vertex 0 (1,1,1)
  [0, 8], [0, 12], [0, 16],
  // Edges from vertex 1 (1,1,-1)
  [1, 9], [1, 12], [1, 17],
  // Edges from vertex 2 (1,-1,1)
  [2, 10], [2, 13], [2, 16],
  // Edges from vertex 3 (1,-1,-1)
  [3, 11], [3, 13], [3, 17],
  // Edges from vertex 4 (-1,1,1)
  [4, 8], [4, 14], [4, 18],
  // Edges from vertex 5 (-1,1,-1)
  [5, 9], [5, 14], [5, 19],
  // Edges from vertex 6 (-1,-1,1)
  [6, 10], [6, 15], [6, 18],
  // Edges from vertex 7 (-1,-1,-1)
  [7, 11], [7, 15], [7, 19],
  // Remaining edges connecting the "middle" vertices
  [8, 10], [9, 11], [12, 14], [13, 15], [16, 17], [18, 19]
];

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
  cubeAngleX = 0;
  cubeAngleY = 0;
  cubeAngleZ = 0;
  pyramidAngleX = 0;
  pyramidAngleY = 0;
  pyramidAngleZ = 0;
  dodecahedronAngleX = 0;
  dodecahedronAngleY = 0;
  dodecahedronAngleZ = 0;
}

// Rotation matrices
function rotateX(point, angle) {
  const [x, y, z] = point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x, y * cos - z * sin, y * sin + z * cos];
}

function rotateY(point, angle) {
  const [x, y, z] = point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

function rotateZ(point, angle) {
  const [x, y, z] = point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos - y * sin, x * sin + y * cos, z];
}

// Project 3D point to 2D with perspective
function project(point, centerX, centerY) {
  const [x, y, z] = point;
  const { focalLength } = settings;
  const scale = focalLength / (focalLength + z);
  return {
    x: centerX + x * scale,
    y: centerY + y * scale
  };
}

// Transform and project all vertices
function transformVertices(vertices, centerX, centerY, ax, ay, az) {
  return vertices.map(v => {
    let point = v;
    point = rotateX(point, ax);
    point = rotateY(point, ay);
    point = rotateZ(point, az);
    return project(point, centerX, centerY);
  });
}

function drawShape(vertices, edges, centerX, centerY, ax, ay, az) {
  const projected = transformVertices(vertices, centerX, centerY, ax, ay, az);

  ctx.strokeStyle = `hsla(${settings.hue}, ${settings.saturation}%, ${settings.lightness}%, ${settings.alpha})`;
  ctx.lineWidth = settings.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [i, j] of edges) {
    const p1 = projected[i];
    const p2 = projected[j];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function draw() {
  // Clear background
  ctx.fillStyle = "rgba(251, 252, 255, 1)";
  ctx.fillRect(0, 0, width, height);

  const cubeVertices = getCubeVertices(settings.cubeSize);
  const pyramidVertices = getPyramidVertices(settings.pyramidSize);
  const dodecahedronVertices = getDodecahedronVertices(settings.dodecahedronSize);

  // Draw cube (top left)
  const cubeX = width * settings.cubeX;
  const cubeY = height * settings.cubeY;
  drawShape(cubeVertices, cubeEdges, cubeX, cubeY, cubeAngleX, cubeAngleY, cubeAngleZ);

  // Draw pyramid (center)
  const pyramidX = width * settings.pyramidX;
  const pyramidY = height * settings.pyramidY;
  drawShape(pyramidVertices, pyramidEdges, pyramidX, pyramidY, pyramidAngleX, pyramidAngleY, pyramidAngleZ);

  // Draw dodecahedron (bottom right)
  const dodecahedronX = width * settings.dodecahedronX;
  const dodecahedronY = height * settings.dodecahedronY;
  drawShape(dodecahedronVertices, dodecahedronEdges, dodecahedronX, dodecahedronY, dodecahedronAngleX, dodecahedronAngleY, dodecahedronAngleZ);
}

function animate() {
  const speed = settings.rotationSpeed;

  // Cube: steady rotation on all axes
  cubeAngleX += speed * 0.8;
  cubeAngleY += speed * 1.0;
  cubeAngleZ += speed * 0.3;

  // Pyramid: faster spin, mainly around Y axis (vertical)
  pyramidAngleX += speed * 0.2;
  pyramidAngleY += speed * 2.0;
  pyramidAngleZ += speed * 0.1;

  // Dodecahedron: slow tumble on all axes
  dodecahedronAngleX += speed * 0.6;
  dodecahedronAngleY += speed * 0.4;
  dodecahedronAngleZ += speed * 0.9;

  draw();
  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvas.value) return;
  initCanvas();
  resetAnimation();
  draw();
  animate();
});

onActivated(() => {
  resetAnimation();
  if (ctx) {
    draw();
  }
  if (!animationId) {
    animate();
  }
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
}
</style>
