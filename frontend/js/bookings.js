/**
 * PG/Hostel Finder and Room Booking System
 * My Bookings Page Module
 * Backend + MongoDB Integrated Version
 */

const API_BASE_URL = "https://pg-hostel-finder-yevr.onrender.com/api";

let activeBookingIdToCancel = null;
let modalTriggerElement = null;
let currentBookings = [];

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initMobileNav();

  const user = checkAuthentication();
  if (!user) return;

  initLogout();
  initModal();

  await loadBookingsFromBackend();
});

// ==========================================
// 2. AUTHENTICATION & NAVBAR
// ==========================================
function checkAuthentication() {
  const overlay =
    document.getElementById("authGuardOverlay");

  const main =
    document.getElementById("bookingsMain");

  let user = null;

  try {
    const rawUser =
      sessionStorage.getItem("pg_current_user");

    const token =
      sessionStorage.getItem("pg_token");

    if (!rawUser || !token) {
      showAuthGuard(overlay, main);
      return null;
    }

    user = JSON.parse(rawUser);

    if (
      !user ||
      typeof user !== "object" ||
      !user.email
    ) {
      showAuthGuard(overlay, main);
      return null;
    }

  } catch (error) {
    console.error(
      "Authentication check failed:",
      error
    );

    showAuthGuard(overlay, main);
    return null;
  }

  if (overlay) {
    overlay.classList.remove("visible");
  }

  if (main) {
    main.style.display = "block";
  }

  const avatarEl =
    document.getElementById("navUserAvatar");

  const nameEl =
    document.getElementById("navUserName");

  if (avatarEl && user.name) {
    avatarEl.textContent =
      user.name
        .charAt(0)
        .toUpperCase();
  }

  if (nameEl && user.name) {
    nameEl.textContent =
      user.name.split(" ")[0];
  }

  return user;
}

function showAuthGuard(
  overlay,
  main
) {
  if (overlay) {
    overlay.classList.add("visible");
  }

  if (main) {
    main.style.display = "none";
  }
}

// ==========================================
// 3. MOBILE NAVIGATION
// ==========================================
function initMobileNav() {
  const navToggleBtn =
    document.getElementById("navToggleBtn");

  const navMenu =
    document.getElementById("navMenu");

  if (!navToggleBtn || !navMenu) {
    return;
  }

  navToggleBtn.addEventListener(
    "click",
    () => {
      const isExpanded =
        navToggleBtn.getAttribute(
          "aria-expanded"
        ) === "true";

      navToggleBtn.setAttribute(
        "aria-expanded",
        String(!isExpanded)
      );

      navMenu.classList.toggle(
        "is-open"
      );
    }
  );
}

// ==========================================
// 4. LOGOUT
// ==========================================
function initLogout() {
  const logoutBtn =
    document.getElementById(
      "logoutBtnNav"
    );

  if (!logoutBtn) return;

  logoutBtn.addEventListener(
    "click",
    () => {
      sessionStorage.removeItem(
        "pg_current_user"
      );

      sessionStorage.removeItem(
        "pg_token"
      );

      sessionStorage.removeItem(
        "pg_booking_data"
      );

      window.location.href =
        "login.html";
    }
  );
}

// ==========================================
// 5. LOAD BOOKINGS FROM BACKEND
// ==========================================
async function loadBookingsFromBackend() {
  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  if (!token) {
    return;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/bookings/my`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      console.error(
        "Failed to load bookings:",
        data.message
      );

      currentBookings = [];

      renderBookingSummary(
        currentBookings
      );

      renderEmptyState(true);

      return;
    }

    currentBookings =
      data.bookings || [];

    renderBookingSummary(
      currentBookings
    );

    if (
      currentBookings.length === 0
    ) {
      renderEmptyState(true);
    } else {
      renderEmptyState(false);
      renderBookings(
        currentBookings
      );
    }

  } catch (error) {
    console.error(
      "Bookings API error:",
      error
    );

    currentBookings = [];

    renderBookingSummary(
      currentBookings
    );

    renderEmptyState(true);
  }
}

// ==========================================
// 6. BOOKING SUMMARY
// ==========================================
function renderBookingSummary(
  bookings
) {
  const totalEl =
    document.getElementById(
      "statTotal"
    );

  const activeEl =
    document.getElementById(
      "statActive"
    );

  const pendingEl =
    document.getElementById(
      "statPending"
    );

  const completedEl =
    document.getElementById(
      "statCompleted"
    );

  let activeCount = 0;
  let pendingCount = 0;
  let completedCount = 0;

  bookings.forEach(
    (booking) => {
      const status =
        (
          booking.status ||
          "Requested"
        ).toLowerCase();

      if (status === "confirmed") {
        activeCount++;
      }

      if (
        status === "requested" ||
        status === "pending"
      ) {
        pendingCount++;
      }

      if (status === "completed") {
        completedCount++;
      }
    }
  );

  if (totalEl) {
    totalEl.textContent =
      bookings.length;
  }

  if (activeEl) {
    activeEl.textContent =
      activeCount;
  }

  if (pendingEl) {
    pendingEl.textContent =
      pendingCount;
  }

  if (completedEl) {
    completedEl.textContent =
      completedCount;
  }
}

// ==========================================
// 7. EMPTY STATE
// ==========================================
function renderEmptyState(
  show
) {
  const emptyState =
    document.getElementById(
      "emptyState"
    );

  const grid =
    document.getElementById(
      "bookingsGrid"
    );

  if (emptyState) {
    emptyState.style.display =
      show ? "flex" : "none";
  }

  if (grid) {
    grid.style.display =
      show ? "none" : "flex";
  }
}

// ==========================================
// 8. RENDER BOOKINGS
// ==========================================
function renderBookings(
  bookings
) {
  const grid =
    document.getElementById(
      "bookingsGrid"
    );

  if (!grid) return;

  grid.innerHTML = "";

  const validStatuses = {
    requested: "Requested",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  bookings.forEach(
    (booking) => {
      const rawStatus =
        (
          booking.status ||
          "Requested"
        ).toLowerCase();

      const displayStatus =
        validStatuses[rawStatus] ||
        "Requested";

      const statusClass =
        `status-${displayStatus.toLowerCase()}`;

      const isCancellable =
        displayStatus === "Requested" ||
        displayStatus === "Confirmed";

      const property =
        booking.property || {};

      const room =
        booking.room || {};

      const propertyName =
        property.name ||
        "Unknown Property";

      const propertyType =
        property.propertyType ||
        "PG";

      const location =
        getPropertyLocation(
          property
        );

      const roomType =
        room.roomType ||
        "Standard";

      const roomNumber =
        room.roomNumber;

      const roomDisplay =
        roomNumber
          ? `Room ${roomNumber} — ${roomType} Sharing`
          : `${roomType} Sharing`;

      const monthlyRent =
        booking.monthlyRent ??
        room.rent ??
        0;

      const deposit =
        booking.deposit ??
        0;

      const occupants =
        booking.occupants ??
        1;

      const bookingId =
        booking.bookingId ||
        "N/A";

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "booking-card";

      // --------------------------------------
      // Card structure
      // --------------------------------------
      card.innerHTML = `
        <div class="booking-card-header">
          <div class="booking-header-left">

            <h3 class="booking-prop-name"></h3>

            <div class="booking-prop-meta">

              <span class="type-tag"></span>

              <span class="location-wrapper">

                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="vertical-align: middle; margin-right: 2px;"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>

                <span class="location-text"></span>

              </span>

            </div>
          </div>

          <span class="status-badge ${statusClass}">
            ${displayStatus}
          </span>
        </div>

        <div class="booking-card-body">

          <div class="detail-block">
            <span class="detail-label">
              Room Details
            </span>

            <span class="detail-value room-text"></span>
          </div>

          <div class="detail-block">
            <span class="detail-label">
              Move-in Date
            </span>

            <span class="detail-value date-text"></span>
          </div>

          <div class="detail-block">
            <span class="detail-label">
              Monthly Rent
            </span>

            <span class="detail-value rent-text"></span>
          </div>

          <div class="detail-block">
            <span class="detail-label">
              Security Deposit
            </span>

            <span class="detail-value deposit-text"></span>
          </div>

          <div class="detail-block">
            <span class="detail-label">
              Occupants
            </span>

            <span class="detail-value occupants-text"></span>
          </div>

        </div>

        <div class="booking-card-footer">

          <div class="booking-id-area">
            Booking ID:
            <strong class="id-text"></strong>
          </div>

          <div class="action-buttons"></div>

        </div>
      `;

      // --------------------------------------
      // Fill data safely
      // --------------------------------------
      card.querySelector(
        ".booking-prop-name"
      ).textContent =
        propertyName;

      card.querySelector(
        ".type-tag"
      ).textContent =
        propertyType;

      card.querySelector(
        ".location-text"
      ).textContent =
        location;

      card.querySelector(
        ".room-text"
      ).textContent =
        roomDisplay;

      card.querySelector(
        ".date-text"
      ).textContent =
        formatDate(
          booking.checkIn
        );

      card.querySelector(
        ".rent-text"
      ).textContent =
        `₹${formatCurrency(
          monthlyRent
        )}`;

      card.querySelector(
        ".deposit-text"
      ).textContent =
        `₹${formatCurrency(
          deposit
        )}`;

      card.querySelector(
        ".occupants-text"
      ).textContent =
        `${occupants} ${
          Number(occupants) === 1
            ? "Person"
            : "Persons"
        }`;

      card.querySelector(
        ".id-text"
      ).textContent =
        bookingId;

      // --------------------------------------
      // Action buttons
      // --------------------------------------
      const actionsContainer =
        card.querySelector(
          ".action-buttons"
        );

      const viewBtn =
        document.createElement(
          "button"
        );

      viewBtn.type =
        "button";

      viewBtn.className =
        "btn btn-secondary";

      viewBtn.textContent =
        "View Details";

      viewBtn.addEventListener(
        "click",
        () => {
          viewBooking(booking);
        }
      );

      actionsContainer.appendChild(
        viewBtn
      );

      if (isCancellable) {
        const cancelBtn =
          document.createElement(
            "button"
          );

        cancelBtn.type =
          "button";

        cancelBtn.className =
          "btn btn-danger";

        cancelBtn.textContent =
          "Cancel Booking";

        cancelBtn.addEventListener(
          "click",
          (event) => {
            triggerCancel(
              booking,
              event.currentTarget
            );
          }
        );

        actionsContainer.appendChild(
          cancelBtn
        );
      }

      grid.appendChild(card);
    }
  );
}

// ==========================================
// 9. PROPERTY LOCATION
// ==========================================
function getPropertyLocation(
  property
) {
  const location =
    property?.location;

  if (!location) {
    return "Pune";
  }

  if (
    location.city &&
    location.state
  ) {
    return `${location.city}, ${location.state}`;
  }

  if (location.city) {
    return location.city;
  }

  if (location.address) {
    return location.address;
  }

  return "Pune";
}

// ==========================================
// 10. VIEW BOOKING
// ==========================================
function viewBooking(
  booking
) {
  if (!booking) return;

  if (!booking.bookingId) {
    return;
  }

  /*
   * confirmation.js expects property
   * and room as MongoDB IDs.
   *
   * /bookings/my returns populated
   * property and room objects, so normalize
   * them before storing.
   */
  const normalizedBooking = {
    ...booking,

    property:
      typeof booking.property === "object"
        ? booking.property._id
        : booking.property,

    room:
      typeof booking.room === "object"
        ? booking.room._id
        : booking.room
  };

  sessionStorage.setItem(
    "pg_booking_data",
    JSON.stringify(
      normalizedBooking
    )
  );

  window.location.href =
    `confirmation.html?bookingId=${encodeURIComponent(
      booking.bookingId
    )}`;
}

// ==========================================
// 11. CANCEL BOOKING MODAL
// ==========================================
function triggerCancel(
  booking,
  triggerElement
) {
  if (!booking || !booking._id) {
    return;
  }

  activeBookingIdToCancel =
    booking._id;

  modalTriggerElement =
    triggerElement;

  const overlay =
    document.getElementById(
      "cancelModalOverlay"
    );

  const closeBtn =
    document.getElementById(
      "closeModalBtn"
    );

  if (overlay) {
    overlay.classList.add(
      "visible"
    );

    overlay.setAttribute(
      "aria-hidden",
      "false"
    );

    if (closeBtn) {
      closeBtn.focus();
    }
  }
}

// ==========================================
// 12. MODAL
// ==========================================
function initModal() {
  const overlay =
    document.getElementById(
      "cancelModalOverlay"
    );

  const closeBtn =
    document.getElementById(
      "closeModalBtn"
    );

  const confirmBtn =
    document.getElementById(
      "confirmCancelBtn"
    );

  const hideModal = () => {
    if (overlay) {
      overlay.classList.remove(
        "visible"
      );

      overlay.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    activeBookingIdToCancel =
      null;

    if (modalTriggerElement) {
      modalTriggerElement.focus();

      modalTriggerElement =
        null;
    }
  };

  if (closeBtn) {
    closeBtn.addEventListener(
      "click",
      hideModal
    );
  }

  if (overlay) {
    overlay.addEventListener(
      "click",
      (event) => {
        if (
          event.target === overlay
        ) {
          hideModal();
        }
      }
    );
  }

  if (confirmBtn) {
    confirmBtn.addEventListener(
      "click",
      async () => {
        const bookingId =
          activeBookingIdToCancel;

        if (bookingId) {
          await executeCancelBooking(
            bookingId
          );
        }

        hideModal();
      }
    );
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        overlay &&
        overlay.classList.contains(
          "visible"
        )
      ) {
        hideModal();
      }
    }
  );
}

// ==========================================
// 13. CANCEL BOOKING THROUGH BACKEND
// ==========================================
async function executeCancelBooking(
  bookingId
) {
  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  if (!token) {
    alert(
      "Your session has expired. Please login again."
    );

    window.location.href =
      "login.html";

    return;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      alert(
        data.message ||
        "Unable to cancel booking."
      );

      return;
    }

    // Reload from MongoDB
    await loadBookingsFromBackend();

  } catch (error) {
    console.error(
      "Cancel booking error:",
      error
    );

    alert(
      "Unable to cancel booking. Please try again."
    );
  }
}

// ==========================================
// 14. FORMAT CURRENCY
// ==========================================
function formatCurrency(
  amount
) {
  const number =
    Number(amount) || 0;

  return number.toLocaleString(
    "en-IN"
  );
}

// ==========================================
// 15. FORMAT DATE
// ==========================================
function formatDate(
  dateString
) {
  if (!dateString) {
    return "Not provided";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not provided";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );
}