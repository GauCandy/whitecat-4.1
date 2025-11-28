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

  // Generate shooting stars with trail effect
  setInterval(() => {
    if (Math.random() < 0.05) { // 5% chance every interval
      createShootingStar(starsContainer);
    }
  }, 100);
}

/**
 * Create shooting star with LCD ghosting trail effect
 */
function createShootingStar(container) {
  // Starting position (top right area)
  const startX = window.innerWidth * (0.7 + Math.random() * 0.3);
  const startY = window.innerHeight * (Math.random() * 0.4);

  // Random speed: fast (1-1.5s) or slow (2-3s)
  const isFast = Math.random() > 0.5;
  const duration = isFast
    ? 1000 + Math.random() * 500  // Fast: 1-1.5 seconds
    : 2000 + Math.random() * 1000; // Slow: 2-3 seconds
  const distance = 800;

  // Create the bright dot
  const star = document.createElement('div');
  star.className = 'shooting-star-head';
  star.style.left = startX + 'px';
  star.style.top = startY + 'px';
  container.appendChild(star);

  // Trail array to store ghost positions
  const trails = [];
  const maxTrails = 15;
  let frame = 0;
  const totalFrames = duration / 16; // 60fps

  const animate = () => {
    frame++;
    const progress = frame / totalFrames;

    if (progress >= 1) {
      // Remove star and trails when done
      star.remove();
      trails.forEach(t => t.remove());
      return;
    }

    // Update star position
    const currentX = startX - (distance * progress);
    const currentY = startY + (distance * progress);
    star.style.left = currentX + 'px';
    star.style.top = currentY + 'px';

    // Create trail ghost every frame for continuous trail
    const trail = document.createElement('div');
    trail.className = 'shooting-star-trail';
    trail.style.left = currentX + 'px';
    trail.style.top = currentY + 'px';
    container.appendChild(trail);
    trails.push(trail);

    // Fade out trail
    let trailOpacity = 0.9;
    const fadeOut = setInterval(() => {
      trailOpacity -= 0.08;
      if (trailOpacity <= 0) {
        clearInterval(fadeOut);
        trail.remove();
        const index = trails.indexOf(trail);
        if (index > -1) trails.splice(index, 1);
      } else {
        trail.style.opacity = trailOpacity;
      }
    }, 25);

    // Limit number of trails
    if (trails.length > 30) {
      const oldTrail = trails.shift();
      if (oldTrail) oldTrail.remove();
    }

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
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
