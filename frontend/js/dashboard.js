/**
 * PG/Hostel Finder and Room Booking System
 * Dashboard Page Module (dashboard.js)
 *
 * Reads session from sessionStorage("pg_current_user") set by login.js.
 * Reads booking from sessionStorage("pg_booking_data") set by booking.js.
 * Does NOT create fake data — shows proper empty states when data is absent.
 */

// ==========================================
// 1. PROPERTY DATA (same as listings.js)
// ==========================================
const PROPERTIES_DATA = [
  {
    id: 1,
    name: "Campus Stay PG",
    location: "Shivajinagar, Pune",
    price: 6500,
    propertyType: "PG",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 2,
    name: "Student Nest Hostel",
    location: "Deccan, Pune",
    price: 7000,
    propertyType: "Hostel",
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 3,
    name: "Urban Living PG",
    location: "Kothrud, Pune",
    price: 6000,
    propertyType: "PG",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 4,
    name: "Green View Hostel",
    location: "Wakad, Pune",
    price: 5500,
    propertyType: "Hostel",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 5,
    name: "Elite Scholar PG",
    location: "Viman Nagar, Pune",
    price: 9500,
    propertyType: "PG",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 6,
    name: "Harmony Student House",
    location: "Hinjawadi, Pune",
    price: 4800,
    propertyType: "Hostel",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 7,
    name: "Comfort Zone PG",
    location: "Kothrud, Pune",
    price: 8500,
    propertyType: "PG",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 8,
    name: "Metro Stay Hostel",
    location: "Shivajinagar, Pune",
    price: 5200,
    propertyType: "Hostel",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80"
  }
];

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();

  const user = checkAuth();
  if (!user) return; // Auth guard is shown; stop further rendering

  renderWelcome(user);
  renderStats(user);
  renderRecentBooking();
  renderRecommendedPGs();
  initLogout();
});

// ==========================================
// 3. AUTH GUARD
// ==========================================
/**
 * Validates the session in sessionStorage("pg_current_user").
 * Shows the auth guard overlay if invalid/missing.
 * @returns {object|null} The user object or null.
 */
function checkAuth() {
  const overlay = document.getElementById("authGuardOverlay");
  const main = document.getElementById("dashboardMain");

  let user = null;

  try {
    const raw = sessionStorage.getItem("pg_current_user");
    if (!raw) {
      showAuthGuard(overlay, main);
      return null;
    }

    user = JSON.parse(raw);

    if (!user || typeof user !== "object" || !user.name || !user.email) {
      showAuthGuard(overlay, main);
      return null;
    }
  } catch (_) {
    showAuthGuard(overlay, main);
    return null;
  }

  // Authenticated — hide guard, show dashboard
  if (overlay) {
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
  }
  if (main) main.style.display = "block";

  // Populate navbar user info
  const avatarEl = document.getElementById("navUserAvatar");
  const nameEl = document.getElementById("navUserName");

  if (avatarEl) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }
  if (nameEl) {
    nameEl.textContent = getFirstName(user.name);
  }

  return user;
}

function showAuthGuard(overlay, main) {
  if (overlay) {
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
  }
  if (main) main.style.display = "none";
}

// ==========================================
// 4. WELCOME BANNER
// ==========================================
function renderWelcome(user) {
  const nameEl = document.getElementById("welcomeName");
  const emailEl = document.getElementById("welcomeEmail");
  const memberEl = document.getElementById("memberSince");

  // Update greeting based on time of day
  const greetingEl = document.querySelector(".welcome-greeting");
  if (greetingEl) {
    greetingEl.textContent = getTimeGreeting() + " 👋";
  }

  if (nameEl) {
    nameEl.textContent = `Welcome back, ${getFirstName(user.name)}!`;
  }

  if (emailEl) {
    emailEl.textContent = user.email;
  }

  if (memberEl && user.loggedInAt) {
    // Use the registered user's createdAt from localStorage if available
    const joinDate = getJoinDate(user.email);
    memberEl.textContent = `Member since ${formatShortDate(joinDate)}`;
  }
}

// ==========================================
// 5. ACCOUNT STATS
// ==========================================
function renderStats(user) {
  const statBookings = document.getElementById("statBookings");
  const statStatus = document.getElementById("statStatus");
  const statJoined = document.getElementById("statJoined");

  const validBookings = getValidBookings();
  const bookingCount = validBookings.length;

  if (statBookings) statBookings.textContent = bookingCount;
  if (statStatus) statStatus.textContent = "Active";

  if (statJoined) {
    const joinDate = getJoinDate(user.email);
    statJoined.textContent = formatShortDate(joinDate);
  }
}

// ==========================================
// 6. RECENT BOOKING
// ==========================================
function renderRecentBooking() {
  const container = document.getElementById("recentBookingContent");
  const emptyState = document.getElementById("bookingEmptyState");

  const validBookings = getValidBookings();

  if (validBookings.length === 0) {
    // No valid booking — show empty state
    if (container) container.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  // Valid booking — hide empty state, render card
  if (emptyState) emptyState.style.display = "none";

  // Select the most recent booking
  const bookingData = validBookings.reduce((latest, current) => {
    const getTimestamp = (b) => {
      if (b.createdAt) {
        const t = new Date(b.createdAt).getTime();
        if (!isNaN(t)) return t;
      }
      if (b.moveInDate) {
        const t = new Date(b.moveInDate).getTime();
        if (!isNaN(t)) return t;
      }
      return 0;
    };

    const latestTime = getTimestamp(latest);
    const currentTime = getTimestamp(current);

    // Prefer more recent times, or fallback to the last element in the array if neither have valid dates
    if (currentTime >= latestTime) {
      return current;
    }
    
    return latest;
  });

  const statusClass = bookingData.status === "Confirmed" ? "status-confirmed" : "status-requested";

  const cardHTML = `
    <div class="dashboard-booking-card">
      <div class="dashboard-booking-header">
        <div class="dashboard-booking-header-left">
          <span class="dashboard-booking-property-name">${escapeHTML(bookingData.propertyName)}</span>
          <span class="dashboard-booking-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHTML(bookingData.location || "Pune")}
          </span>
        </div>
        <span class="dashboard-booking-status ${statusClass}">
          ${escapeHTML(bookingData.status || "Requested")}
        </span>
      </div>

      <div class="dashboard-booking-body">
        <div class="dashboard-booking-detail">
          <span class="dashboard-booking-label">Room Type</span>
          <span class="dashboard-booking-value">${escapeHTML(bookingData.roomType)} Sharing</span>
        </div>
        <div class="dashboard-booking-detail">
          <span class="dashboard-booking-label">Move-in Date</span>
          <span class="dashboard-booking-value">${formatFullDate(bookingData.moveInDate)}</span>
        </div>
        <div class="dashboard-booking-detail">
          <span class="dashboard-booking-label">Monthly Rent</span>
          <span class="dashboard-booking-value">₹${formatCurrency(bookingData.monthlyRent)}</span>
        </div>
        <div class="dashboard-booking-detail">
          <span class="dashboard-booking-label">Total Payable</span>
          <span class="dashboard-booking-value">₹${formatCurrency(bookingData.totalAmount)}</span>
        </div>
      </div>

      <div class="dashboard-booking-footer">
        <span class="dashboard-booking-id">Booking ID: <strong>${escapeHTML(bookingData.bookingId)}</strong></span>
        <a href="confirmation.html?bookingId=${encodeURIComponent(bookingData.bookingId)}" class="dashboard-btn-view">
          View Details
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>
    </div>
  `;

  if (container) container.innerHTML = cardHTML;
}

// ==========================================
// 7. RECOMMENDED PGs
// ==========================================
function renderRecommendedPGs() {
  const grid = document.getElementById("recommendedGrid");
  if (!grid) return;

  // Show 4 random (shuffled) properties
  const shuffled = [...PROPERTIES_DATA].sort(() => 0.5 - Math.random());
  const recommendations = shuffled.slice(0, 4);

  let html = "";

  recommendations.forEach((prop) => {
    const tagClass = prop.propertyType === "PG" ? "rec-tag-pg" : "rec-tag-hostel";

    html += `
      <a href="details.html?id=${prop.id}" class="rec-card">
        <img src="${prop.image}" alt="${escapeHTML(prop.name)} interior" class="rec-card-image" loading="lazy">
        <div class="rec-card-body">
          <span class="rec-card-type-tag ${tagClass}">${escapeHTML(prop.propertyType)}</span>
          <h3 class="rec-card-name">${escapeHTML(prop.name)}</h3>
          <span class="rec-card-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHTML(prop.location)}
          </span>
          <div class="rec-card-bottom">
            <span class="rec-card-price">₹${prop.price.toLocaleString("en-IN")}<span>/mo</span></span>
            <span class="rec-card-btn">View →</span>
          </div>
        </div>
      </a>
    `;
  });

  grid.innerHTML = html;
}

// ==========================================
// 8. LOGOUT
// ==========================================
function initLogout() {
  const logoutBtn = document.getElementById("logoutBtnNav");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    try {
      // Only clear session — preserve localStorage user accounts and booking data
      sessionStorage.removeItem("pg_current_user");
    } catch (_) {
      // Fail silently
    }

    window.location.href = "login.html";
  });
}

// ==========================================
// 9. NAVBAR TOGGLE
// ==========================================
function initMobileNav() {
  const navToggleBtn = document.getElementById("navToggleBtn");
  const navMenu = document.getElementById("navMenu");

  if (!navToggleBtn || !navMenu) return;

  navToggleBtn.addEventListener("click", () => {
    const isExpanded = navToggleBtn.getAttribute("aria-expanded") === "true";
    navToggleBtn.setAttribute("aria-expanded", String(!isExpanded));
    navMenu.classList.toggle("is-open");
  });
}

// ==========================================
// 10. UTILITY FUNCTIONS
// ==========================================

/**
 * Safely parses the booking session data and returns an array of valid bookings.
 * Handles both legacy single-object format and multiple-booking array format.
 */
function getValidBookings() {
  const parsedData = safeParseSession("pg_booking_data");
  if (!parsedData) return [];

  let bookings = [];
  if (Array.isArray(parsedData)) {
    bookings = parsedData;
  } else if (typeof parsedData === "object") {
    bookings = [parsedData];
  }

  // Filter out any explicitly invalid entries
  return bookings.filter(b => b && typeof b === "object" && b.bookingId && b.propertyName);
}

/**
 * Safely parses a sessionStorage key, returning null on any failure.
 */
function safeParseSession(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : null;
  } catch (_) {
    return null;
  }
}

/**
 * Extracts the first name from a full name string.
 */
function getFirstName(fullName) {
  if (!fullName) return "User";
  return fullName.trim().split(/\s+/)[0];
}

/**
 * Returns a greeting based on the current time of day.
 */
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Gets the join date for a user from the localStorage user registry.
 * Falls back to the login timestamp if user record not found.
 */
function getJoinDate(email) {
  try {
    const raw = localStorage.getItem("pg_demo_users");
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users)) {
        const found = users.find((u) => u.email === email);
        if (found && found.createdAt) return found.createdAt;
      }
    }
  } catch (_) {
    // Fall through
  }

  // Fallback: use the current session's loggedInAt
  try {
    const session = JSON.parse(sessionStorage.getItem("pg_current_user"));
    if (session && session.loggedInAt) return session.loggedInAt;
  } catch (_) {
    // Fall through
  }

  return new Date().toISOString();
}

/**
 * Formats an ISO date string to "Sep 2026" short format.
 */
function formatShortDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short"
  });
}

/**
 * Formats an ISO or YYYY-MM-DD date string to "18 Sep 2026" full format.
 */
function formatFullDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Formats a number as Indian-style currency.
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString("en-IN");
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}