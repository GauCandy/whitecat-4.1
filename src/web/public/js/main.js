/**
 * WhiteCat Bot - Minimal Starry Sky
 */

// Create minimal starry background on page load
document.addEventListener('DOMContentLoaded', async () => {
  createStarryBackground();
  await fetchBotStats();
});

/**
 * Create simple starry sky with shooting stars
 */
function createStarryBackground() {
  let starsContainer = document.querySelector('.stars');
  if (!starsContainer) {
    starsContainer = document.createElement('div');
    starsContainer.className = 'stars';
    document.body.appendChild(starsContainer);
  }

  // Generate regular stars
  const starCount = 200;
  const brightStarCount = 30;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Random position
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';

    // Random size (1px to 2.5px)
    const size = Math.random() * 1.5 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';

    // Random animation delay
    star.style.animationDelay = Math.random() * 3 + 's';
    star.style.animationDuration = (Math.random() * 2 + 2) + 's';

    // Some bright stars
    if (i < brightStarCount) {
      star.classList.add('bright');
    }

    starsContainer.appendChild(star);
  }

  // Create canvas for shooting stars
  const canvas = document.createElement('canvas');
  canvas.className = 'shooting-stars-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '2';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const shootingStars = [];

  // Resize canvas on window resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Create shooting stars periodically
  setInterval(() => {
    if (Math.random() < 0.05 && shootingStars.length < 5) {
      shootingStars.push(new ShootingStar());
    }
  }, 100);

  // Animation loop
  function animateShootingStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      star.update();
      star.draw(ctx);

      if (star.isDead()) {
        shootingStars.splice(i, 1);
      }
    }

    requestAnimationFrame(animateShootingStars);
  }

  animateShootingStars();
}

/**
 * ShootingStar class - Physics-based two-particle system
 * Head particle leads, tail particle follows with spring force
 */
class ShootingStar {
  constructor() {
    // Starting position (top-right area)
    this.startX = window.innerWidth * (0.7 + Math.random() * 0.3);
    this.startY = window.innerHeight * (Math.random() * 0.4);

    // Random speed variation
    const isFast = Math.random() > 0.5;
    this.duration = isFast
      ? 1250 + Math.random() * 500  // 1.25-1.75s (fast)
      : 2500 + Math.random() * 1000; // 2.5-3.5s (slow)

    // Distance to travel (exit viewport)
    const diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
    this.distance = diagonal * 1.2;

    // Head particle (leads)
    this.headX = this.startX;
    this.headY = this.startY;

    // Tail particle (follows with lag)
    this.tailX = this.startX;
    this.tailY = this.startY;

    // Spring constant - controls how tightly tail follows head
    this.springStrength = 0.03; // Lower = longer trail

    this.startTime = Date.now();
    this.alive = true;
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // Update head position (moves along diagonal path)
    this.headX = this.startX - (this.distance * progress);
    this.headY = this.startY + (this.distance * progress);

    // Tail follows head with spring force (creates natural trailing)
    const dx = this.headX - this.tailX;
    const dy = this.headY - this.tailY;

    this.tailX += dx * this.springStrength;
    this.tailY += dy * this.springStrength;

    // Mark as dead when head exits viewport and duration complete
    if (progress >= 1) {
      this.alive = false;
    }
  }

  draw(ctx) {
    // Calculate trail distance for alpha/brightness
    const trailLength = Math.sqrt(
      (this.headX - this.tailX) ** 2 +
      (this.headY - this.tailY) ** 2
    );

    // Draw gradient line from tail to head
    const gradient = ctx.createLinearGradient(
      this.tailX, this.tailY,
      this.headX, this.headY
    );

    // Tail (dimmest)
    gradient.addColorStop(0, 'rgba(150, 180, 255, 0)');
    gradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.15)');
    gradient.addColorStop(0.5, 'rgba(220, 235, 255, 0.4)');
    gradient.addColorStop(0.8, 'rgba(240, 248, 255, 0.7)');
    // Head (brightest)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

    // Draw multiple passes for glow effect
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';

    // Outer glow (widest, faintest)
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(this.tailX, this.tailY);
    ctx.lineTo(this.headX, this.headY);
    ctx.stroke();

    // Middle glow
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(this.tailX, this.tailY);
    ctx.lineTo(this.headX, this.headY);
    ctx.stroke();

    // Core trail
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(this.tailX, this.tailY);
    ctx.lineTo(this.headX, this.headY);
    ctx.stroke();

    // Reset alpha
    ctx.globalAlpha = 1;

    // Draw bright head particle
    const headGradient = ctx.createRadialGradient(
      this.headX, this.headY, 0,
      this.headX, this.headY, 8
    );
    headGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    headGradient.addColorStop(0.3, 'rgba(240, 248, 255, 0.9)');
    headGradient.addColorStop(0.6, 'rgba(200, 220, 255, 0.5)');
    headGradient.addColorStop(1, 'rgba(150, 180, 255, 0)');

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(this.headX, this.headY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  isDead() {
    return !this.alive;
  }
}

/**
 * Fetch bot statistics from API
 */
async function fetchBotStats() {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      const stats = await response.json();

      // Animate server count
      if (stats.servers) {
        animateValue('serverCount', 0, stats.servers, 1500);
      }

      // Animate user count
      if (stats.users) {
        animateValue('userCount', 0, stats.users, 2000);
      }
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
}

/**
 * Animate number counter
 */
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  if (!element) return;

  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = formatNumber(Math.floor(current));
  }, 16);
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
