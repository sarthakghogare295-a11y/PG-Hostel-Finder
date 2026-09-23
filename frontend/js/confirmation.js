/**
 * PG/Hostel Finder and Room Booking System
 * Booking Confirmation Page Module
 * Backend + MongoDB Integrated Version
 */

const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
  initMobileNav();
  await loadConfirmationData();
});

// ==========================================
// 1. NAVBAR TOGGLE
// ==========================================
function initMobileNav() {
  const navToggleBtn =
    document.getElementById("navToggleBtn");

  const navMenu =
    document.getElementById("navMenu");

  if (!navToggleBtn || !navMenu) return;

  navToggleBtn.addEventListener("click", () => {
    const isExpanded =
      navToggleBtn.getAttribute("aria-expanded") === "true";

    navToggleBtn.setAttribute(
      "aria-expanded",
      String(!isExpanded)
    );

    navMenu.classList.toggle("is-open");
  });

  const navLinks =
    navMenu.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        navMenu.classList.remove("is-open");

        navToggleBtn.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    });
  });
}

// ==========================================
// 2. LOAD CONFIRMATION DATA
// ==========================================
async function loadConfirmationData() {
  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const targetBookingId =
    urlParams.get("bookingId");

  const token =
    sessionStorage.getItem("pg_token");

  if (!targetBookingId || !token) {
    showErrorState();
    return;
  }

  // Get booking saved by booking.js
  const rawBooking =
    sessionStorage.getItem(
      "pg_booking_data"
    );

  if (!rawBooking) {
    showErrorState();
    return;
  }

  let booking;

  try {
    booking =
      JSON.parse(rawBooking);
  } catch (error) {
    console.error(
      "Malformed booking data:",
      error
    );

    showErrorState();
    return;
  }

  // Make sure URL booking ID matches
  if (
    !booking ||
    booking.bookingId !== targetBookingId
  ) {
    console.error(
      "Booking ID mismatch."
    );

    showErrorState();
    return;
  }

  try {
    // ======================================
    // Load real property
    // ======================================
    const propertyResponse =
      await fetch(
        `${API_BASE_URL}/properties/${booking.property}`
      );

    const propertyData =
      await propertyResponse.json();

    if (
      !propertyResponse.ok ||
      !propertyData.success
    ) {
      throw new Error(
        propertyData.message ||
        "Failed to load property"
      );
    }

    const property =
      propertyData.property;

    // ======================================
    // Load real room
    // ======================================
    const roomResponse =
      await fetch(
        `${API_BASE_URL}/rooms/${booking.room}`
      );

    const roomData =
      await roomResponse.json();

    if (
      !roomResponse.ok ||
      !roomData.success
    ) {
      throw new Error(
        roomData.message ||
        "Failed to load room"
      );
    }

    const room =
      roomData.room;

    // ======================================
    // Get logged-in user information
    // ======================================
    let currentUser = null;

    const rawUser =
      sessionStorage.getItem(
        "pg_current_user"
      );

    if (rawUser) {
      try {
        currentUser =
          JSON.parse(rawUser);
      } catch (error) {
        console.error(
          "Failed to parse current user:",
          error
        );
      }
    }

    // ======================================
    // Build confirmation display object
    // ======================================
    const confirmationData = {
      bookingId:
        booking.bookingId,

      status:
        booking.status || "Requested",

      propertyName:
        property.name,

      propertyType:
        property.propertyType,

      location:
        `${property.location?.city || ""}, ${
          property.location?.state || ""
        }`,

      roomType:
        room.roomType,

      monthlyRent:
        booking.monthlyRent,

      securityDeposit:
        booking.deposit,

      totalAmount:
        booking.totalAmount,

      guestName:
        currentUser?.name || "User",

      guestEmail:
        currentUser?.email || "Not available",

      guestPhone:
        currentUser?.mobile || "Not available",

      moveInDate:
        booking.checkIn,

      occupants:
        booking.occupants,

      specialRequests:
        booking.specialRequests || ""
    };

    renderConfirmation(
      confirmationData
    );

  } catch (error) {
    console.error(
      "Confirmation loading error:",
      error
    );

    showErrorState();
  }
}

// ==========================================
// 3. RENDER CONFIRMATION
// ==========================================
function renderConfirmation(data) {
  const errorCard =
    document.getElementById(
      "confirmationErrorState"
    );

  const contentWrapper =
    document.getElementById(
      "confirmationContent"
    );

  if (errorCard) {
    errorCard.classList.remove(
      "visible"
    );
  }

  if (contentWrapper) {
    contentWrapper.style.display =
      "block";
  }

  document.title =
    `Booking Confirmed (${data.bookingId}) — PG Finder`;

  // --------------------------------------
  // Status + Booking ID
  // --------------------------------------
  setText(
    "displayBookingStatus",
    `Status: ${data.status}`
  );

  setText(
    "displayBookingId",
    data.bookingId
  );

  // --------------------------------------
  // Property
  // --------------------------------------
  setText(
    "displayPropertyName",
    data.propertyName
  );

  setText(
    "displayPropertyType",
    data.propertyType || "PG"
  );

  const locationElement =
    document.querySelector(
      "#displayPropertyLocation span"
    );

  if (locationElement) {
    locationElement.textContent =
      data.location || "Pune";
  }

  // --------------------------------------
  // Room
  // --------------------------------------
  setText(
    "displayRoomType",
    `${data.roomType} Sharing Room`
  );

  // --------------------------------------
  // Price
  // --------------------------------------
  setText(
    "displayMonthlyRent",
    `₹${formatCurrency(
      data.monthlyRent
    )}`
  );

  setText(
    "displaySecurityDeposit",
    `₹${formatCurrency(
      data.securityDeposit
    )}`
  );

  setText(
    "displayTotalAmount",
    `₹${formatCurrency(
      data.totalAmount
    )}`
  );

  // --------------------------------------
  // Guest Details
  // --------------------------------------
  setText(
    "displayGuestName",
    data.guestName
  );

  setText(
    "displayGuestEmail",
    data.guestEmail
  );

  setText(
    "displayGuestPhone",
    data.guestPhone
  );

  setText(
    "displayMoveInDate",
    formatDate(
      data.moveInDate
    )
  );

  setText(
    "displayOccupants",
    `${data.occupants} ${
      Number(data.occupants) === 1
        ? "Person"
        : "Persons"
    }`
  );

  const hasRequests =
    data.specialRequests &&
    data.specialRequests.trim()
      .length > 0;

  setText(
    "displaySpecialRequests",
    hasRequests
      ? data.specialRequests
      : "None specified"
  );
}

// ==========================================
// 4. ERROR STATE
// ==========================================
function showErrorState() {
  const errorCard =
    document.getElementById(
      "confirmationErrorState"
    );

  const contentWrapper =
    document.getElementById(
      "confirmationContent"
    );

  if (contentWrapper) {
    contentWrapper.style.display =
      "none";
  }

  if (errorCard) {
    errorCard.classList.add(
      "visible"
    );
  }
}

// ==========================================
// 5. TEXT HELPER
// ==========================================
function setText(
  elementId,
  text
) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent =
      text ?? "";
  }
}

// ==========================================
// 6. CURRENCY FORMATTER
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
// 7. DATE FORMATTER
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
    return dateString;
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