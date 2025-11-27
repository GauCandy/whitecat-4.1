/**
 * WhiteCat Bot - Arctic Aurora Experience
 */

// Create Arctic background on page load
document.addEventListener('DOMContentLoaded', async () => {
  createArcticBackground();
  await fetchBotStats();
  initSmoothScroll();
});

/**
 * Create the Arctic aurora background with snow and northern lights
 */
function createArcticBackground() {
  let starsContainer = document.querySelector('.stars');
  if (!starsContainer) {
    starsContainer = document.createElement('div');
    starsContainer.className = 'stars';
    document.body.appendChild(starsContainer);
  }

  // Create Aurora Borealis layers
  for (let i = 1; i <= 3; i++) {
    const aurora = document.createElement('div');
    aurora.className = `aurora-layer aurora-${i}`;
    document.body.insertBefore(aurora, document.body.firstChild);
  }

  // Create snow ground
  const snowGround = document.createElement('div');
  snowGround.className = 'snow-ground';
  document.body.appendChild(snowGround);

  // Generate stars with varied brightness
  const starCount = 200; // More stars for Arctic night sky
  const brightStarCount = 30;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Random position (mostly upper 70% of screen)
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 70 + '%';

    // Random size (1px to 3px)
    const size = Math.random() * 2 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';

    // Random animation delay and duration
    star.style.animationDelay = Math.random() * 5 + 's';
    star.style.animationDuration = (Math.random() * 3 + 3) + 's';

    // Make some stars extra bright
    if (i < brightStarCount) {
      star.classList.add('bright');
    }

    starsContainer.appendChild(star);
  }

  // Generate falling snowflakes
  for (let i = 0; i < 50; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';

    // Random position
    snowflake.style.left = Math.random() * 100 + '%';

    // Random size (2px to 6px)
    const size = Math.random() * 4 + 2;
    snowflake.style.width = size + 'px';
    snowflake.style.height = size + 'px';

    // Random drift direction
    const drift = (Math.random() - 0.5) * 100;
    snowflake.style.setProperty('--drift', `${drift}px`);

    // Random animation delay and duration
    const delay = Math.random() * 10;
    const duration = Math.random() * 10 + 15; // 15-25s
    snowflake.style.animation = `snowFall ${duration}s linear ${delay}s infinite`;

    starsContainer.appendChild(snowflake);
  }

  // Generate Arctic shooting stars
  for (let i = 0; i < 5; i++) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';

    // Random starting position (top and right side)
    shootingStar.style.top = Math.random() * 30 + '%';
    shootingStar.style.right = Math.random() * 20 + '%';

    // Random animation delay (0-30s) and duration (3-5s)
    const delay = Math.random() * 30;
    const duration = Math.random() * 2 + 3;
    shootingStar.style.animation = `shootArcticStar ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`;
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
    const data = await response.json();

    // Animate stat numbers
    if (data.servers !== undefined) {
      animateValue('serverCount', 0, data.servers, 2000);
    }

    if (data.users !== undefined) {
      animateValue('userCount', 0, data.users, 2000);
    }
  } catch (error) {
    console.error('Failed to fetch bot stats:', error);
    // Fallback values
    document.getElementById('serverCount').textContent = '-';
    document.getElementById('userCount').textContent = '-';
  }
}

/**
 * Animate number counter
 */
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  if (!element) return;

  const range = end - start;
  const increment = range / (duration / 16); // 60fps
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
 * Format large numbers with K/M suffixes
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Parallax effect on mouse move (optional enhancement)
 */
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

  // Apply subtle parallax to stars
  const stars = document.querySelector('.stars');
  if (stars) {
    stars.style.transform = `translate(${mouseX * 10}px, ${mouseY * 10}px)`;
  }
});

/**
 * Intersection Observer for scroll animations
 */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, observerOptions);

// Observe elements with 'reveal' class
document.querySelectorAll('.reveal').forEach(el => {
  observer.observe(el);
});
