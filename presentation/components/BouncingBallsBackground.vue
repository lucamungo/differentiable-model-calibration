<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";

const props = defineProps({
  ballCount: {
    type: Number,
    default: 30
  },
  ballRadius: {
    type: Number,
    default: 12
  }
});

const canvas = ref(null);
let animationId = null;
let ctx = null;

// Use fixed dimensions matching Slidev's internal slide size
const width = 980;
const height = 552;

const settings = {
  speed: 3,
  backgroundFade: 1,
  hueStart: 200,
  hueEnd: 200,
  saturation: 90,
  lightness: 70,
  alpha: 0.9
};

let balls = [];

function initCanvas() {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  // Use fixed canvas buffer size, let CSS handle display scaling
  const pixelRatio = 2;
  canvasEl.width = width * pixelRatio;
  canvasEl.height = height * pixelRatio;

  ctx = canvasEl.getContext("2d");
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function initBalls() {
  balls = [];
  const { speed, hueStart, hueEnd } = settings;
  const { ballCount, ballRadius } = props;

  for (let i = 0; i < ballCount; i++) {
    // Random position (with margin for radius)
    const x = ballRadius + Math.random() * (width - 2 * ballRadius);
    const y = ballRadius + Math.random() * (height - 2 * ballRadius);

    // Random direction, same speed
    const angle = Math.random() * 2 * Math.PI;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // Color based on index
    const hue = hueStart + (hueEnd - hueStart) * (i / ballCount);

    balls.push({ x, y, vx, vy, radius: ballRadius, hue });
  }
}

function updateBalls() {
  const { ballRadius } = props;

  // Move balls
  for (const ball of balls) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce off walls
    if (ball.x - ballRadius < 0) {
      ball.x = ballRadius;
      ball.vx = Math.abs(ball.vx);
    } else if (ball.x + ballRadius > width) {
      ball.x = width - ballRadius;
      ball.vx = -Math.abs(ball.vx);
    }

    if (ball.y - ballRadius < 0) {
      ball.y = ballRadius;
      ball.vy = Math.abs(ball.vy);
    } else if (ball.y + ballRadius > height) {
      ball.y = height - ballRadius;
      ball.vy = -Math.abs(ball.vy);
    }
  }

  // Ball-to-ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        // Normalize collision vector
        const nx = dx / dist;
        const ny = dy / dist;

        // Relative velocity
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;

        // Relative velocity along collision normal
        const dvn = dvx * nx + dvy * ny;

        // Only resolve if balls are approaching
        if (dvn > 0) {
          // Update velocities (elastic collision, equal mass)
          a.vx -= dvn * nx;
          a.vy -= dvn * ny;
          b.vx += dvn * nx;
          b.vy += dvn * ny;

          // Separate balls to prevent overlap
          const overlap = (minDist - dist) / 2;
          a.x -= overlap * nx;
          a.y -= overlap * ny;
          b.x += overlap * nx;
          b.y += overlap * ny;
        }
      }
    }
  }
}

function draw() {
  const { saturation, lightness, alpha } = settings;

  // Clear background
  ctx.fillStyle = "rgba(251, 252, 255, 1)";
  ctx.fillRect(0, 0, width, height);

  // Draw balls
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${ball.hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    ctx.fill();
  }
}

function animate() {
  updateBalls();
  draw();
  animationId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvas.value) return;
  initCanvas();
  initBalls();
  draw();
  animate();
});

onActivated(() => {
  // Restart the animation when navigating back to the slide
  initBalls();
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
  <canvas ref="canvas" class="balls-canvas"></canvas>
</template>

<style scoped>
.balls-canvas {
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
