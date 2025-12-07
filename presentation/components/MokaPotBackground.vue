<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

const props = defineProps({
  // Array of pot configurations
  // Each pot can have: posX, posY, scale, rotationSpeedX, rotationSpeedY, rotationSpeedZ, initialAngleX, initialAngleY, initialAngleZ
  pots: {
    type: Array,
    default: () => [{ posX: 0.75, posY: 0.5, scale: 200, rotationSpeedY: 0.03 }]
  },
  lineWidth: { type: Number, default: 1.2 },
  hue: { type: Number, default: 212 },
  saturation: { type: Number, default: 90 },
  lightness: { type: Number, default: 60 },
  alpha: { type: Number, default: 0.8 },
  focalLength: { type: Number, default: 600 },
  tiltX: { type: Number, default: 0.3 }
});

const canvas = ref(null);
let animationId = null;
let ctx = null;

const width = 980;
const height = 552;

// Each pot gets its own angle state
let potStates = [];

// Generate octagon vertices at a given height and radius
function createOctagonRing(y, radius) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    points.push([
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    ]);
  }
  return points;
}

function getMokaVertices(s) {
  const vertices = [];

  // Bottom chamber (boiler) - simple trapezoid, wider at bottom
  // Level 0: Base bottom (widest)
  vertices.push(...createOctagonRing(-s * 1.2, s * 0.7));   // 0-7

  // Level 1: Base top (narrower, at waist)
  vertices.push(...createOctagonRing(-s * 0.2, s * 0.45));   // 8-15

  // Waist
  // Level 2: Waist
  vertices.push(...createOctagonRing(-s * 0.1, s * 0.45));  // 16-23

  // Top chamber (collector) - flares out from waist
  // Level 3: Top chamber bottom
  vertices.push(...createOctagonRing(s * 0.0, s * 0.45));   // 24-31

  // Level 4: Top chamber top (widest)
  vertices.push(...createOctagonRing(s * 1.0, s * 0.65));   // 32-39

  // Lid
  // Level 5: Lid rim
  vertices.push(...createOctagonRing(s * 1.05, s * 0.6));   // 40-47

  // Level 6: Lid top
  vertices.push(...createOctagonRing(s * 1.15, s * 0.05));  // 48-55

  // Knob
  // Level 7: Knob base
  vertices.push(...createOctagonRing(s * 1.25, s * 0.06));  // 56-63

  // Level 8: Knob top
  vertices.push(...createOctagonRing(s * 1.43, s * 0.09));  // 64-71

  // Knob apex
  vertices.push([0, s * 1.5, 0]);  // 72

  // Handle - simple curve (right side)
  vertices.push([s * 0.5, -s * 0.1, 0]);      // 73: attach lower
  vertices.push([s * 0.85, s * 0.4, 0]);      // 74: curve out
  vertices.push([s * 0.75, s * 0.9, 0]);      // 75: attach upper

  // Handle inner
  vertices.push([s * 0.45, s * 0.0, 0]);      // 76: inner lower
  vertices.push([s * 0.65, s * 0.4, 0]);      // 77: inner mid
  vertices.push([s * 0.6, s * 0.8, 0]);       // 78: inner upper

  // Spout (left side)
  // Beak top point - sticks out
  vertices.push([-s * 0.9, s * 1.0, 0]);  // 79: beak top point

  // Beak bottom point - on chamber surface at half height
  // At y = 0.5, radius interpolated between 0.45 and 0.65 = 0.55
  vertices.push([-s * 0.55, s * 0.5, 0]); // 80: beak bottom point

  return vertices;
}

function getMokaEdges() {
  const edges = [];

  // Helper: connect octagon ring edges
  function addRingEdges(startIdx) {
    for (let i = 0; i < 8; i++) {
      edges.push([startIdx + i, startIdx + ((i + 1) % 8)]);
    }
  }

  // Helper: connect two octagon levels
  function addVerticalEdges(level1Start, level2Start) {
    for (let i = 0; i < 8; i++) {
      edges.push([level1Start + i, level2Start + i]);
    }
  }

  // Bottom chamber - levels 0-1
  addRingEdges(0);    // Level 0: Base bottom
  addRingEdges(8);    // Level 1: Base top
  addVerticalEdges(0, 8);

  // Waist - level 2
  addRingEdges(16);   // Level 2: Waist
  addVerticalEdges(8, 16);

  // Top chamber - levels 3-4
  addRingEdges(24);   // Level 3: Top chamber bottom
  addRingEdges(32);   // Level 4: Top chamber top
  addVerticalEdges(16, 24);
  addVerticalEdges(24, 32);

  // Lid - levels 5-6
  addRingEdges(40);   // Level 5: Lid rim
  addRingEdges(48);   // Level 6: Lid top
  addVerticalEdges(32, 40);
  addVerticalEdges(40, 48);

  // Knob - levels 7-8
  addRingEdges(56);   // Level 7: Knob base
  addRingEdges(64);   // Level 8: Knob top
  addVerticalEdges(48, 56);
  addVerticalEdges(56, 64);

  // Knob apex connections
  for (let i = 0; i < 8; i++) {
    edges.push([64 + i, 72]);
  }

  // Handle outer (73-75)
  edges.push([73, 74]);
  edges.push([74, 75]);

  // Handle inner (76-78)
  edges.push([76, 77]);
  edges.push([77, 78]);

  // Handle caps
  edges.push([73, 76]);
  edges.push([75, 78]);

  // Connect handle to body (right side: vertex 0 of each ring)
  edges.push([73, 8]);    // Lower to base top (level 1, i=0)
  edges.push([76, 16]);   // Inner lower to waist (level 2, i=0)
  edges.push([75, 32]);   // Upper to top chamber (level 4, i=0)
  edges.push([78, 32]);   // Inner upper to top chamber

  // Spout - triangle at top of chamber
  // Beak top point (79) connects to two body vertices on left side of level 4
  edges.push([79, 35]);   // Beak top to front-left (level 4, i=3)
  edges.push([79, 36]);   // Beak top to back-left (level 4, i=4)

  // Line from beak top to beak bottom
  edges.push([79, 80]);   // Beak top to beak bottom

  // Lines from beak bottom to top chamber vertices
  edges.push([80, 35]);   // Beak bottom to front-left (level 4, i=3)
  edges.push([80, 36]);   // Beak bottom to back-left (level 4, i=4)

  return edges;
}

const mokaEdges = getMokaEdges();

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
  potStates = props.pots.map(pot => ({
    angleX: props.tiltX,
    angleY: pot.initialAngleY || 0,
    angleZ: 0
  }));
}

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

function project(point, centerX, centerY) {
  const [x, y, z] = point;
  const focalLength = props.focalLength;
  const scale = focalLength / (focalLength + z);
  return {
    x: centerX + x * scale,
    y: centerY - y * scale,  // Flip Y so up is positive
    z: z
  };
}

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

  ctx.strokeStyle = `hsla(${props.hue}, ${props.saturation}%, ${props.lightness}%, ${props.alpha})`;
  ctx.lineWidth = props.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [i, j] of edges) {
    const p1 = projected[i];
    const p2 = projected[j];
    if (!p1 || !p2) continue;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = "rgba(251, 252, 255, 1)";
  ctx.fillRect(0, 0, width, height);

  props.pots.forEach((pot, index) => {
    const state = potStates[index];
    if (!state) return;

    const scale = pot.scale || 200;
    const mokaVertices = getMokaVertices(scale);

    const centerX = width * (pot.posX || 0.5);
    const centerY = height * (pot.posY || 0.5);

    drawShape(mokaVertices, mokaEdges, centerX, centerY, state.angleX, state.angleY, state.angleZ);
  });
}

function animate() {
  props.pots.forEach((pot, index) => {
    const state = potStates[index];
    if (!state) return;

    const speed = pot.rotationSpeed || 0.03;
    state.angleY += speed;
  });

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
}
</style>
