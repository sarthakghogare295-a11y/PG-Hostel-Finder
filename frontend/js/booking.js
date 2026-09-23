/**
 * PG/Hostel Finder and Room Booking System
 * Booking Page Module
 * Backend + MongoDB Integrated Version
 */

const API_BASE_URL = "https://pg-hostel-finder-yevr.onrender.com/api";

let currentProperty = null;
let currentRoom = null;

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initBookingPage();
});

async function initBookingPage() {
  initMobileNav();
  initDateConstraints();

  await loadBookingData();

  setupFormValidation();
}

// ==========================================
// 2. NAVBAR
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
}

// ==========================================
// 3. DATE CONSTRAINT
// ==========================================
function initDateConstraints() {
  const moveInDateInput =
    document.getElementById("moveInDate");

  if (!moveInDateInput) return;

  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(today.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(today.getDate())
      .padStart(2, "0");

  moveInDateInput.min =
    `${year}-${month}-${day}`;
}

// ==========================================
// 4. LOAD PROPERTY + ROOM
// ==========================================
async function loadBookingData() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const propertyId =
    params.get("id");

  const roomId =
    params.get("roomId");

  const roomType =
    params.get("room");

  if (!propertyId) {
    showErrorState();
    return;
  }

  try {
    // --------------------------------------
    // Load property
    // --------------------------------------
    const propertyResponse =
      await fetch(
        `${API_BASE_URL}/properties/${propertyId}`
      );

    const propertyData =
      await propertyResponse.json();

    if (
      !propertyResponse.ok ||
      !propertyData.success
    ) {
      console.error(
        "Property loading failed:",
        propertyData.message
      );

      showErrorState();
      return;
    }

    currentProperty =
      propertyData.property;

    // --------------------------------------
    // Load rooms
    // --------------------------------------
    const roomResponse =
      await fetch(
        `${API_BASE_URL}/rooms/property/${propertyId}`
      );

    const roomData =
      await roomResponse.json();

    if (
      !roomResponse.ok ||
      !roomData.success
    ) {
      console.error(
        "Room loading failed:",
        roomData.message
      );

      showErrorState();
      return;
    }

    const rooms =
      roomData.rooms || [];

    // Prefer exact MongoDB room ID
    if (roomId) {
      currentRoom =
        rooms.find(
          (room) =>
            room._id === roomId
        );
    }

    // Fallback to room type
    if (!currentRoom && roomType) {
      currentRoom =
        rooms.find(
          (room) =>
            room.roomType.toLowerCase() ===
            roomType.toLowerCase()
        );
    }

    // No valid room
    if (!currentRoom) {
      console.error(
        "Selected room not found."
      );

      showErrorState();
      return;
    }

    // Check real availability
    if (
      currentRoom.status !== "Available" ||
      currentRoom.availableBeds <= 0
    ) {
      console.error(
        "Selected room is no longer available."
      );

      showErrorState();
      return;
    }

    renderBookingSummary(
      currentProperty,
      currentRoom
    );

    // Auto-fill authenticated user's data
    prefillUserData();

  } catch (error) {
    console.error(
      "Booking data loading error:",
      error
    );

    showErrorState();
  }
}

// ==========================================
// 5. ERROR STATE
// ==========================================
function showErrorState() {
  const errorBox =
    document.getElementById(
      "bookingErrorState"
    );

  const mainWrapper =
    document.getElementById(
      "bookingMainWrapper"
    );

  if (mainWrapper) {
    mainWrapper.style.display =
      "none";
  }

  if (errorBox) {
    errorBox.classList.add(
      "visible"
    );
  }
}

// ==========================================
// 6. RENDER BOOKING SUMMARY
// ==========================================
function renderBookingSummary(
  property,
  room
) {
  setTextContent(
    "breadcrumbPropertyName",
    property.name
  );

  setTextContent(
    "bookingPropertyName",
    property.name
  );

  setTextContent(
    "bookingPropertyType",
    property.propertyType
  );

  const locationElement =
    document.querySelector(
      "#bookingPropertyLocation span"
    );

  if (locationElement) {
    locationElement.textContent =
      `${property.location?.city || ""}, ${
        property.location?.state || ""
      }`;
  }

  setTextContent(
    "bookingRoomType",
    `${room.roomType} Sharing Room`
  );

  const monthlyRent =
    Number(room.rent) || 0;

  const securityDeposit =
    Number(property.deposit) || 0;

  const totalAmount =
    monthlyRent +
    securityDeposit;

  setTextContent(
    "bookingMonthlyRent",
    `₹${monthlyRent.toLocaleString("en-IN")}`
  );

  setTextContent(
    "bookingSecurityDeposit",
    `₹${securityDeposit.toLocaleString("en-IN")}`
  );

  setTextContent(
    "summaryRent",
    `₹${monthlyRent.toLocaleString("en-IN")}`
  );

  setTextContent(
    "summaryDeposit",
    `₹${securityDeposit.toLocaleString("en-IN")}`
  );

  setTextContent(
    "summaryTotal",
    `₹${totalAmount.toLocaleString("en-IN")}`
  );
}

// ==========================================
// 7. PREFILL USER DATA
// ==========================================
function prefillUserData() {
  try {
    const rawUser =
      sessionStorage.getItem(
        "pg_current_user"
      );

    if (!rawUser) return;

    const user =
      JSON.parse(rawUser);

    const nameInput =
      document.getElementById(
        "guestFullName"
      );

    const emailInput =
      document.getElementById(
        "guestEmail"
      );

    const phoneInput =
      document.getElementById(
        "guestPhone"
      );

    if (
      nameInput &&
      user.name
    ) {
      nameInput.value =
        user.name;
    }

    if (
      emailInput &&
      user.email
    ) {
      emailInput.value =
        user.email;
    }

    if (
      phoneInput &&
      user.mobile
    ) {
      phoneInput.value =
        user.mobile;
    }

  } catch (error) {
    console.error(
      "Failed to prefill user data:",
      error
    );
  }
}

// ==========================================
// 8. FORM VALIDATION
// ==========================================
function setupFormValidation() {
  const form =
    document.getElementById(
      "bookingSubmissionForm"
    );

  if (!form) return;

  const fullNameInput =
    document.getElementById(
      "guestFullName"
    );

  const emailInput =
    document.getElementById(
      "guestEmail"
    );

  const phoneInput =
    document.getElementById(
      "guestPhone"
    );

  const dateInput =
    document.getElementById(
      "moveInDate"
    );

  const occupantsInput =
    document.getElementById(
      "occupantCount"
    );

  const termsCheckbox =
    document.getElementById(
      "termsCheckbox"
    );

  const formMessage =
    document.getElementById(
      "formMessage"
    );

  const formMessageText =
    document.getElementById(
      "formMessageText"
    );

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      await handleBookingSubmit();
    }
  );

  async function handleBookingSubmit() {
    let isValid = true;
    let errorMsg = "";

    clearErrors();

    // --------------------------------------
    // Authentication
    // --------------------------------------
    const token =
      sessionStorage.getItem(
        "pg_token"
      );

    if (!token) {
      showFormMessage(
        "You must be logged in to make a booking. Please log in first."
      );

      return;
    }

    if (
      !currentProperty ||
      !currentRoom
    ) {
      showFormMessage(
        "Booking information is unavailable. Please select the room again."
      );

      return;
    }

    // --------------------------------------
    // Name
    // --------------------------------------
    const nameVal =
      fullNameInput.value.trim();

    if (
      !nameVal ||
      nameVal.length < 2
    ) {
      markError(
        fullNameInput
      );

      errorMsg =
        "Please enter a valid full name.";

      isValid = false;
    }

    // --------------------------------------
    // Email
    // --------------------------------------
    const emailVal =
      emailInput.value.trim();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailVal ||
      !emailRegex.test(
        emailVal
      )
    ) {
      markError(
        emailInput
      );

      errorMsg =
        errorMsg ||
        "Please enter a valid email address.";

      isValid = false;
    }

    // --------------------------------------
    // Phone
    // --------------------------------------
    const phoneVal =
      phoneInput.value.trim();

    const phoneRegex =
      /^[6-9]\d{9}$/;

    if (
      !phoneVal ||
      !phoneRegex.test(
        phoneVal
      )
    ) {
      markError(
        phoneInput
      );

      errorMsg =
        errorMsg ||
        "Please enter a valid 10-digit mobile number.";

      isValid = false;
    }

    // --------------------------------------
    // Move-in date
    // --------------------------------------
    const dateVal =
      dateInput.value;

    if (!dateVal) {
      markError(
        dateInput
      );

      errorMsg =
        errorMsg ||
        "Please select a move-in date.";

      isValid = false;

    } else {
      const selectedDate =
        new Date(
          `${dateVal}T00:00:00`
        );

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      if (
        selectedDate < today
      ) {
        markError(
          dateInput
        );

        errorMsg =
          errorMsg ||
          "Move-in date cannot be in the past.";

        isValid = false;
      }
    }

    // --------------------------------------
    // Occupants
    // --------------------------------------
    const occupantsVal =
      parseInt(
        occupantsInput.value,
        10
      );

    const roomCapacity =
      Number(
        currentRoom.capacity
      ) || 1;

    const availableBeds =
      Number(
        currentRoom.availableBeds
      ) || 0;

    if (
      isNaN(occupantsVal) ||
      occupantsVal < 1
    ) {
      markError(
        occupantsInput
      );

      errorMsg =
        errorMsg ||
        "At least 1 occupant is required.";

      isValid = false;

    } else if (
      occupantsVal >
      roomCapacity
    ) {
      markError(
        occupantsInput
      );

      errorMsg =
        errorMsg ||
        `This room allows a maximum of ${roomCapacity} occupant${
          roomCapacity !== 1
            ? "s"
            : ""
        }.`;

      isValid = false;

    } else if (
      occupantsVal >
      availableBeds
    ) {
      markError(
        occupantsInput
      );

      errorMsg =
        errorMsg ||
        `Only ${availableBeds} bed${
          availableBeds !== 1
            ? "s"
            : ""
        } currently available.`;

      isValid = false;
    }

    // --------------------------------------
    // Terms
    // --------------------------------------
    if (
      !termsCheckbox.checked
    ) {
      errorMsg =
        errorMsg ||
        "You must agree to the terms and conditions.";

      isValid = false;
    }

    if (!isValid) {
      showFormMessage(
        errorMsg
      );

      return;
    }

    // --------------------------------------
    // CREATE BACKEND BOOKING
    // --------------------------------------
    await createBooking(
      {
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        date: dateVal,
        occupants: occupantsVal
      }
    );
  }

  // Remove errors while typing
  [
    fullNameInput,
    emailInput,
    phoneInput,
    dateInput,
    occupantsInput
  ].forEach(
    (input) => {
      if (!input) return;

      input.addEventListener(
        "input",
        () => {
          input.classList.remove(
            "input-error"
          );

          if (formMessage) {
            formMessage.classList.remove(
              "visible"
            );
          }
        }
      );
    }
  );

  if (termsCheckbox) {
    termsCheckbox.addEventListener(
      "change",
      () => {
        if (formMessage) {
          formMessage.classList.remove(
            "visible"
          );
        }
      }
    );
  }
}

// ==========================================
// 9. CREATE BOOKING IN MONGODB
// ==========================================
async function createBooking(
  guestData
) {
  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  const specialRequestInput =
    document.getElementById(
      "specialRequest"
    );

  const specialRequests =
    specialRequestInput
      ? specialRequestInput.value.trim()
      : "";

  const monthlyRent =
    Number(
      currentRoom.rent
    ) || 0;

  const deposit =
    Number(
      currentProperty.deposit
    ) || 0;

  const totalAmount =
    monthlyRent +
    deposit;

  const payload = {
    propertyId:
      currentProperty._id,

    roomId:
      currentRoom._id,

    occupants:
      guestData.occupants,

    checkIn:
      guestData.date,

    checkOut:
      null,

    monthlyRent:
      monthlyRent,

    deposit:
      deposit,

    totalAmount:
      totalAmount,

    paymentMethod:
      "Cash",

    paymentStatus:
      "Pending",

    specialRequests:
      specialRequests
  };

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      showFormMessage(
        data.message ||
          "Unable to create booking."
      );

      return;
    }

    console.log(
      "Booking created successfully:",
      data.booking
    );

    // Save only the backend booking
    // reference for confirmation page
    sessionStorage.setItem(
      "pg_booking_data",
      JSON.stringify(
        data.booking
      )
    );

    window.location.href =
      `confirmation.html?bookingId=${encodeURIComponent(
        data.booking.bookingId
      )}`;

  } catch (error) {
    console.error(
      "Booking creation error:",
      error
    );

    showFormMessage(
      "Unable to create booking. Please try again."
    );
  }
}

// ==========================================
// 10. FORM ERROR HELPERS
// ==========================================
function markError(
  inputElement
) {
  if (inputElement) {
    inputElement.classList.add(
      "input-error"
    );
  }
}

function clearErrors() {
  const inputs = [
    document.getElementById(
      "guestFullName"
    ),

    document.getElementById(
      "guestEmail"
    ),

    document.getElementById(
      "guestPhone"
    ),

    document.getElementById(
      "moveInDate"
    ),

    document.getElementById(
      "occupantCount"
    )
  ];

  inputs.forEach(
    (input) => {
      if (input) {
        input.classList.remove(
          "input-error"
        );
      }
    }
  );

  const formMessage =
    document.getElementById(
      "formMessage"
    );

  if (formMessage) {
    formMessage.classList.remove(
      "visible"
    );
  }
}

function showFormMessage(
  message
) {
  const formMessage =
    document.getElementById(
      "formMessage"
    );

  const formMessageText =
    document.getElementById(
      "formMessageText"
    );

  if (
    formMessage &&
    formMessageText
  ) {
    formMessage.classList.add(
      "visible"
    );

    formMessageText.textContent =
      message;
  }
}

// ==========================================
// 11. TEXT HELPER
// ==========================================
function setTextContent(
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