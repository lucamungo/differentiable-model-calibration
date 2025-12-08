<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, watch } from "vue";

const props = defineProps({
  orbits: { type: Array, default: () => [60, 100, 140, 180, 220] },
  sunRadius: { type: Number, default: 25 },
  planetRadii: { type: Array, default: () => [8, 10, 12, 9, 7] },
  moons: { type: Array, default: () => [0, 0, 1, 2, 1] },
  moonRadius: { type: Number, default: 3 },
  speeds: { type: Array, default: null },
  eccentricities: { type: Array, default: () => [0, 0, 0, 0, 0] },
  orbitRotations: { type: Array, default: () => [0, 0, 0, 0, 0] },
  sunAtFocus: { type: Boolean, default: true },
  timeScale: { type: Number, default: 1 },
  rotateX: { type: Number, default: 66 },
  rotateY: { type: Number, default: 0 },
  rotateZ: { type: Number, default: 0 }
});

const canvas = ref(null);
let animationId = null;
let ctx = null;

const width = 980;
const height = 552;
const centerX = width / 2;
const centerY = height / 2;

// Pre-computed color strings
const hue = 212, sat = 96, light = 78;
const colorLight = `hsl(${hue}, ${sat}%, 88%)`;
const colorBase = `hsl(${hue}, ${sat}%, ${light}%)`;
const colorOrbit = `hsla(${hue}, ${sat}%, ${light}%, 0.4)`;
const colorMoonLight = `hsla(${hue}, ${sat}%, 88%, 0.9)`;
const colorMoonBase = `hsla(${hue}, ${sat}%, ${light}%, 0.7)`;

// State
let planets = null;
let orbitCanvas = null;
let orbitCtx = null;

// Pre-computed rotation matrix coefficients
let rotMat = new Float32Array(9);

function updateRotationMatrix() {
  const rx = props.rotateX * Math.PI / 180;
  const ry = props.rotateY * Math.PI / 180;
  const rz = props.rotateZ * Math.PI / 180;

  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  // Combined rotation matrix (Z * Y * X)
  rotMat[0] = cy * cz;
  rotMat[1] = cz * sx * sy - cx * sz;
  rotMat[2] = sx * sz + cx * cz * sy;
  rotMat[3] = cy * sz;
  rotMat[4] = cx * cz + sx * sy * sz;
  rotMat[5] = cx * sy * sz - cz * sx;
  rotMat[6] = -sy;
  rotMat[7] = cy * sx;
  rotMat[8] = cx * cy;
}

// Inline rotation - only x,y output needed for 2D, z for depth
function rotateX(x, y) { return rotMat[0] * x + rotMat[1] * y; }
function rotateY(x, y) { return rotMat[3] * x + rotMat[4] * y; }
function rotateZ(x, y) { return rotMat[6] * x + rotMat[7] * y; }

function initCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const dpr = 2;
  canvasEl.width = width * dpr;
  canvasEl.height = height * dpr;
  ctx = canvasEl.getContext("2d", { alpha: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Offscreen canvas for static orbits
  orbitCanvas = document.createElement("canvas");
  orbitCanvas.width = width * dpr;
  orbitCanvas.height = height * dpr;
  orbitCtx = orbitCanvas.getContext("2d");
  orbitCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderOrbits() {
  if (!orbitCtx) return;

  orbitCtx.fillStyle = "#fbfcff";
  orbitCtx.fillRect(0, 0, width, height);
  orbitCtx.strokeStyle = colorOrbit;
  orbitCtx.lineWidth = 1;

  const segments = 48;
  const step = (2 * Math.PI) / segments;
  const sunAtFocus = props.sunAtFocus;

  for (const p of planets) {
    const a = p.semiMajor;
    const e = p.eccentricity;
    const cosR = p.cosRot, sinR = p.sinRot;
    const b = p.semiMinor;
    const oneMinusE2 = 1 - e * e;

    orbitCtx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = i * step;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let ox, oy;
      if (sunAtFocus && e > 0) {
        const r = a * oneMinusE2 / (1 + e * cosA);
        ox = r * cosA;
        oy = r * sinA;
      } else {
        ox = a * cosA;
        oy = b * sinA;
      }

      // Apply orbit rotation then camera rotation
      const rx = ox * cosR - oy * sinR;
      const ry = ox * sinR + oy * cosR;
      const sx = centerX + rotateX(rx, ry);
      const sy = centerY + rotateY(rx, ry);

      i === 0 ? orbitCtx.moveTo(sx, sy) : orbitCtx.lineTo(sx, sy);
    }
    orbitCtx.stroke();
  }
}

function initPlanets() {
  const { orbits, planetRadii, moons, moonRadius, speeds, eccentricities, orbitRotations } = props;
  const baseOrbit = orbits[0] || 60;
  const numPlanets = orbits.length;

  // Pre-allocate planet array
  planets = new Array(numPlanets);

  for (let i = 0; i < numPlanets; i++) {
    const a = orbits[i];
    const e = eccentricities[i] ?? 0;
    const rotDeg = orbitRotations[i] ?? 0;
    const rotRad = rotDeg * Math.PI / 180;

    let speed;
    if (speeds && speeds[i] != null) {
      speed = speeds[i] / 1000;
    } else {
      speed = (2 * Math.PI) / (Math.pow(a / baseOrbit, 1.5) * 240);
    }

    const moonCount = moons[i] ?? 0;
    const planetMoons = new Array(moonCount);
    const pRadius = planetRadii[i] ?? planetRadii[0] ?? 8;

    for (let m = 0; m < moonCount; m++) {
      planetMoons[m] = {
        orbitRadius: pRadius + 8 + m * 6,
        speed: speed * (8 + Math.random() * 4),
        angle: Math.random() * 2 * Math.PI,
        radius: moonRadius,
        x: 0, y: 0, z: 0
      };
    }

    planets[i] = {
      semiMajor: a,
      semiMinor: a * Math.sqrt(1 - e * e),
      eccentricity: e,
      oneMinusE2: 1 - e * e,
      cosRot: Math.cos(rotRad),
      sinRot: Math.sin(rotRad),
      speed,
      angle: Math.random() * 2 * Math.PI,
      radius: pRadius,
      moons: planetMoons,
      x: 0, y: 0, z: 0
    };
  }

  updateRotationMatrix();
  renderOrbits();
}

function updatePlanets() {
  const timeScale = props.timeScale;
  const sunAtFocus = props.sunAtFocus;

  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    p.angle += p.speed * timeScale;

    const cosA = Math.cos(p.angle);
    const sinA = Math.sin(p.angle);

    let ox, oy;
    if (sunAtFocus && p.eccentricity > 0) {
      const r = p.semiMajor * p.oneMinusE2 / (1 + p.eccentricity * cosA);
      ox = r * cosA;
      oy = r * sinA;
    } else {
      ox = p.semiMajor * cosA;
      oy = p.semiMinor * sinA;
    }

    // Apply orbit rotation
    const rx = ox * p.cosRot - oy * p.sinRot;
    const ry = ox * p.sinRot + oy * p.cosRot;

    // Apply camera rotation
    p.x = centerX + rotateX(rx, ry);
    p.y = centerY + rotateY(rx, ry);
    p.z = rotateZ(rx, ry);

    // Update moons
    for (let m = 0; m < p.moons.length; m++) {
      const moon = p.moons[m];
      moon.angle += moon.speed * timeScale;

      const mx = moon.orbitRadius * Math.cos(moon.angle);
      const my = moon.orbitRadius * Math.sin(moon.angle);

      moon.x = p.x + rotateX(mx, my);
      moon.y = p.y + rotateY(mx, my);
      moon.z = p.z + rotateZ(mx, my);
    }
  }
}

// Pre-allocated bodies array for sorting
let bodies = [];
let bodiesCount = 0;

function collectBodies() {
  bodiesCount = 0;

  // Sun
  bodies[bodiesCount++] = { type: 0, x: centerX, y: centerY, z: 0, radius: props.sunRadius };

  // Planets and moons
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    bodies[bodiesCount++] = { type: 1, x: p.x, y: p.y, z: p.z, radius: p.radius };

    for (let m = 0; m < p.moons.length; m++) {
      const moon = p.moons[m];
      bodies[bodiesCount++] = { type: 2, x: moon.x, y: moon.y, z: moon.z, radius: moon.radius };
    }
  }

  // Sort by z (far to near)
  for (let i = 1; i < bodiesCount; i++) {
    const item = bodies[i];
    let j = i - 1;
    while (j >= 0 && bodies[j].z < item.z) {
      bodies[j + 1] = bodies[j];
      j--;
    }
    bodies[j + 1] = item;
  }
}

function draw() {
  // Draw cached orbits
  ctx.drawImage(orbitCanvas, 0, 0, width, height);

  collectBodies();

  for (let i = 0; i < bodiesCount; i++) {
    const b = bodies[i];
    const r = b.radius;

    if (b.type === 0) {
      // Sun - fixed lighting
      const grad = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, 0, b.x, b.y, r);
      grad.addColorStop(0, colorLight);
      grad.addColorStop(1, colorBase);
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, 6.2832);
      ctx.fillStyle = grad;
      ctx.fill();
    } else {
      // Planet or moon - light faces sun
      const dx = centerX - b.x;
      const dy = centerY - b.y;
      const invDist = 1 / (Math.sqrt(dx * dx + dy * dy) || 1);
      const nx = dx * invDist * r * 0.4;
      const ny = dy * invDist * r * 0.4;

      const grad = ctx.createRadialGradient(b.x + nx, b.y + ny, 0, b.x, b.y, r);
      if (b.type === 2) {
        grad.addColorStop(0, colorMoonLight);
        grad.addColorStop(1, colorMoonBase);
      } else {
        grad.addColorStop(0, colorLight);
        grad.addColorStop(1, colorBase);
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, 6.2832);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }
}

function animate() {
  updatePlanets();
  draw();
  animationId = requestAnimationFrame(animate);
}

// Watch for rotation changes to re-render orbits
watch(() => [props.rotateX, props.rotateY, props.rotateZ], () => {
  updateRotationMatrix();
  if (planets) renderOrbits();
});

watch(() => [props.orbits, props.eccentricities, props.orbitRotations, props.sunAtFocus], () => {
  if (ctx) {
    initPlanets();
  }
}, { deep: true });

onMounted(() => {
  if (!canvas.value) return;
  initCanvas();
  initPlanets();

  // Pre-allocate bodies array
  const maxBodies = 1 + props.orbits.length + props.moons.reduce((a, b) => a + b, 0);
  bodies = new Array(maxBodies).fill(null).map(() => ({ type: 0, x: 0, y: 0, z: 0, radius: 0 }));

  animate();
});

onActivated(() => {
  if (ctx && !animationId) {
    initPlanets();
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
  orbitCanvas = null;
  orbitCtx = null;
});
</script>

<template>
  <canvas ref="canvas" class="planetary-canvas"></canvas>
</template>

<style scoped>
.planetary-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -10;
  pointer-events: none;
  will-change: transform;
}
</style>
