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

  // Generate shooting stars
  for (let i = 0; i < 4; i++) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';

    // Random starting position (top right area)
    shootingStar.style.top = Math.random() * 40 + '%';
    shootingStar.style.right = Math.random() * 30 + '%';

    // Random animation
    const delay = Math.random() * 20;
    const duration = Math.random() * 2 + 2;
    shootingStar.style.animation = `shootingStar ${duration}s linear infinite`;
    shootingStar.style.animationDelay = `${delay}s`;

    starsContainer.appendChild(shootingStar);
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
