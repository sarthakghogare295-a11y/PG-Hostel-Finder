/**
 * PG/Hostel Finder and Room Booking System
 * Main JavaScript Module (Frontend Vanilla JS)
 * 
 * Features:
 * - Mobile hamburger navigation
 * - Search form validation & forwarding
 * - Popular location quick-select
 * - Geolocation ("Find PGs Near Me")
 * - Scroll-triggered reveal animations (IntersectionObserver)
 * - Animated stat counters
 * - Card interaction wiring
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initNavbarScroll();
  initSearchForm();
  initPopularLocations();
  initGeolocation();
  initCardInteractions();
  initScrollReveal();
  initStatCounters();
});

// ==========================================
// 1.5 Scroll-based Navbar Style Toggle
// ==========================================
function initNavbarScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  const SCROLL_THRESHOLD = 50;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > SCROLL_THRESHOLD) {
          header.classList.add('header--scrolled');
        } else {
          header.classList.remove('header--scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Check initial state
}

// ==========================================
// 1. Mobile Hamburger Menu Toggle
// ==========================================
function initMobileNav() {
  const navToggleBtn = document.getElementById('navToggleBtn');
  const navMenu = document.getElementById('navMenu');

  if (!navToggleBtn || !navMenu) return;

  navToggleBtn.addEventListener('click', () => {
    const isExpanded = navToggleBtn.getAttribute('aria-expanded') === 'true';
    navToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    navMenu.classList.toggle('is-open');
  });

  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navMenu.classList.remove('is-open');
        navToggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// ==========================================
// 2. Search Form Validation & Forwarding
// ==========================================
function initSearchForm() {
  const searchForm = document.getElementById('homeSearchForm');
  const locationInput = document.getElementById('searchLocation');
  const budgetSelect = document.getElementById('searchBudget');
  const roomTypeSelect = document.getElementById('searchRoomType');

  if (!searchForm) return;

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const loc = locationInput ? locationInput.value.trim() : "";
    const budget = budgetSelect ? budgetSelect.value : "";
    const roomType = roomTypeSelect ? roomTypeSelect.value : "";

    if (!loc && !budget && !roomType) {
      if (locationInput) {
        locationInput.focus();
        locationInput.placeholder = 'Please enter a location or select a filter';
      }
      return;
    }

    const params = new URLSearchParams();
    if (loc) params.set('location', loc);
    if (budget) params.set('budget', budget);
    if (roomType) params.set('roomType', roomType);

    window.location.href = `listings.html?${params.toString()}`;
  });
}

// ==========================================
// 3. Quick Popular Location Selection
// ==========================================
function initPopularLocations() {
  const locationCards = document.querySelectorAll('.location-card');
  const locationInput = document.getElementById('searchLocation');

  locationCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedLocation = card.getAttribute('data-location');
      if (locationInput && selectedLocation) {
        locationInput.value = selectedLocation;
        locationInput.focus();

        card.style.borderColor = 'var(--primary)';
        setTimeout(() => {
          card.style.borderColor = '';
        }, 600);

        locationInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

// ==========================================
// 4. Geolocation UI ("Find PGs Near Me")
// ==========================================
function initGeolocation() {
  const geoBtn = document.getElementById('geoBtn');
  const geoBtnText = document.getElementById('geoBtnText');
  const locationInput = document.getElementById('searchLocation');

  if (!geoBtn || !locationInput) return;

  geoBtn.addEventListener('click', () => {
    geoBtn.disabled = true;
    if (geoBtnText) geoBtnText.textContent = 'Detecting Location...';

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          /**
           * The frontend prototype stores coordinates only;
           * reverse geocoding is not implemented yet;
           * the future Node.js + MongoDB backend will use these coordinates for geospatial nearby-property queries.
           */
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          try {
            sessionStorage.setItem('pg_user_location', JSON.stringify(userLocation));
          } catch (_) {}

          locationInput.value = 'Location detected';
          geoBtn.disabled = false;
          if (geoBtnText) geoBtnText.textContent = 'Location Detected';
          setTimeout(() => {
            if (geoBtnText) geoBtnText.textContent = 'Find PGs Near Me';
          }, 2500);
        },
        (error) => {
          let errorMsg = 'Location access was denied or timed out. Please enter your location manually.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. Please enter your location manually.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out. Please enter your location manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location information is unavailable. Please enter your location manually.';
          }
          alert(errorMsg);
          geoBtn.disabled = false;
          if (geoBtnText) geoBtnText.textContent = 'Find PGs Near Me';
        },
        { timeout: 8000 }
      );
    } else {
      alert('Geolocation services are not supported by this browser.');
      geoBtn.disabled = false;
      if (geoBtnText) geoBtnText.textContent = 'Find PGs Near Me';
    }
  });
}

// ==========================================
// 5. Card Interaction Wiring
// ==========================================
function initCardInteractions() {
  const cardButtons = document.querySelectorAll('.property-card .card-btn');
  cardButtons.forEach(btn => {
    const parentCard = btn.closest('.property-card');
    const propertyId = parentCard ? parentCard.getAttribute('data-property-id') : null;

    if (propertyId && btn.tagName === 'A') {
      btn.setAttribute('href', `details.html?id=${propertyId}`);
    }
  });
}

// ==========================================
// 6. Scroll-Triggered Reveal Animations
// ==========================================
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.scroll-reveal');

  if (!revealElements.length) return;

  // Check if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all elements immediately
    revealElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    }
  );

  revealElements.forEach(el => observer.observe(el));
}

// ==========================================
// 7. Animated Stat Counters
// ==========================================
function initStatCounters() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  if (!statNumbers.length) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: show final values immediately
    statNumbers.forEach(el => {
      const target = el.getAttribute('data-target');
      el.textContent = formatStatNumber(parseFloat(target), target);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: 0.3
    }
  );

  statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(element) {
  const targetStr = element.getAttribute('data-target');
  const target = parseFloat(targetStr);
  const isDecimal = targetStr.includes('.');
  const duration = 1800; // ms
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out cubic for smooth deceleration
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = easedProgress * target;

    element.textContent = formatStatNumber(currentValue, targetStr);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatStatNumber(target, targetStr);
    }
  }

  requestAnimationFrame(update);
}

function formatStatNumber(value, targetStr) {
  const isDecimal = targetStr.includes('.');

  if (isDecimal) {
    return value.toFixed(1);
  }

  const rounded = Math.floor(value);

  if (rounded >= 1000) {
    return rounded.toLocaleString('en-IN') + '+';
  }

  return rounded + '+';
}