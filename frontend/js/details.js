/**
 * PG/Hostel Finder and Room Booking System
 * Property Details Module
 * Backend + MongoDB Integrated Version
 */

const API_BASE_URL = "http://localhost:5000/api";

let currentProperty = null;
let currentImageIndex = 0;
let selectedRoom = null;
let isFavorited = false;

// ==========================================
// 1. AMENITY ICONS
// ==========================================
const AMENITY_ICONS = {
  "Wi-Fi": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,

  "Food": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,

  "Laundry": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 8v1"/></svg>`,

  "CCTV": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,

  "Parking": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`,

  "Power Backup": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initAuthUI();
  initGalleryControls();
  initFavoriteButton();
  initBookingCTA();

  await loadPropertyFromUrl();
});

// ==========================================
// 3. NAVBAR
// ==========================================
function initNavbar() {
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
// 4. AUTH UI
// ==========================================
function initAuthUI() {
  const navActions =
    document.querySelector(".nav-actions");

  if (!navActions) return;

  const token =
    sessionStorage.getItem("pg_token");

  const currentUser =
    sessionStorage.getItem("pg_current_user");

  if (!token) return;

  let user = null;

  try {
    user = currentUser
      ? JSON.parse(currentUser)
      : null;
  } catch (error) {
    console.error(
      "Failed to read current user:",
      error
    );
  }

  const userName =
    user?.name || "Account";

  navActions.innerHTML = `
    <a href="profile.html" class="btn btn-login">
      ${userName}
    </a>

    <button
      type="button"
      class="btn btn-register"
      id="logoutBtn"
    >
      Logout
    </button>
  `;

  const logoutBtn =
    document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("pg_token");
      sessionStorage.removeItem("pg_current_user");

      window.location.href =
        "login.html";
    });
  }
}

// ==========================================
// 5. LOAD PROPERTY FROM MONGODB
// ==========================================
async function loadPropertyFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const propertyId =
    params.get("id");

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
    let rooms = [];

    try {
      const roomResponse =
        await fetch(
          `${API_BASE_URL}/rooms/property/${propertyId}`
        );

      const roomData =
        await roomResponse.json();

      if (
        roomResponse.ok &&
        roomData.success
      ) {
        rooms =
          roomData.rooms || [];
      }
    } catch (roomError) {
      console.error(
        "Room loading failed:",
        roomError
      );
    }

    currentProperty.rooms =
      rooms;

    // --------------------------------------
    // Render everything
    // --------------------------------------
    const errorBox =
      document.getElementById(
        "detailsErrorState"
      );

    const contentWrap =
      document.getElementById(
        "detailsContentWrapper"
      );

    if (errorBox) {
      errorBox.classList.remove(
        "visible"
      );
    }

    if (contentWrap) {
      contentWrap.style.display =
        "block";
    }

    renderPropertyDetails(
      currentProperty
    );

    await loadFavoriteStatus();

  } catch (error) {
    console.error(
      "Property details loading error:",
      error
    );

    showErrorState();
  }
}

// ==========================================
// 6. ERROR STATE
// ==========================================
function showErrorState() {
  const errorBox =
    document.getElementById(
      "detailsErrorState"
    );

  const contentWrap =
    document.getElementById(
      "detailsContentWrapper"
    );

  const breadcrumb =
    document.getElementById(
      "breadcrumbPropertyName"
    );

  if (breadcrumb) {
    breadcrumb.textContent =
      "Not Found";
  }

  if (contentWrap) {
    contentWrap.style.display =
      "none";
  }

  if (errorBox) {
    errorBox.classList.add(
      "visible"
    );
  }
}

// ==========================================
// 7. RENDER PROPERTY
// ==========================================
function renderPropertyDetails(data) {
  document.title =
    `${data.name} — PG Finder`;

  setTextContent(
    "breadcrumbPropertyName",
    data.name
  );

  setTextContent(
    "propertyName",
    data.name
  );

  setTextContent(
    "propertyType",
    data.propertyType
  );

  const locationText =
    data.location
      ? `${data.location.city || ""}, ${data.location.state || ""}`
      : "Location unavailable";

  setTextContent(
    "propertyLocation",
    locationText
  );

  // Rating is not stored in the current
  // Property MongoDB model.
  setTextContent(
    "propertyRating",
    "—"
  );

  const availability =
    data.status === "Active"
      ? "Available"
      : "Unavailable";

  const availBadge =
    document.getElementById(
      "propertyAvailability"
    );

  if (availBadge) {
    availBadge.textContent =
      availability;

    availBadge.className =
      `status-badge ${
        availability === "Available"
          ? "available"
          : "few-left"
      }`;
  }

  renderGallery(
    data.images || []
  );

  setTextContent(
    "propertyDescription",
    data.description ||
      "No description available."
  );

  setTextContent(
    "overviewPrice",
    `₹${Number(
      data.rentFrom || 0
    ).toLocaleString("en-IN")}/mo`
  );

  setTextContent(
    "overviewDeposit",
    `₹${Number(
      data.deposit || 0
    ).toLocaleString("en-IN")}`
  );

  setTextContent(
    "overviewType",
    data.propertyType
  );

  setTextContent(
    "stickyRent",
    `₹${Number(
      data.rentFrom || 0
    ).toLocaleString("en-IN")}`
  );

  renderAmenities(
    data.facilities || []
  );

  renderRooms(
    data.rooms || []
  );

  renderRules(
    data.rules || []
  );

  const locationArea =
    data.location
      ? `${data.location.city || ""}, ${data.location.state || ""}`
      : "Area unavailable";

  setTextContent(
    "locationArea",
    locationArea
  );

  setTextContent(
    "fullAddress",
    data.location?.address ||
      "Address unavailable"
  );
}

// ==========================================
// 8. TEXT HELPER
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

// ==========================================
// 9. GALLERY
// ==========================================
function renderGallery(images) {
  const mainImg =
    document.getElementById(
      "mainGalleryImage"
    );

  const thumbsContainer =
    document.getElementById(
      "galleryThumbnails"
    );

  if (
    !mainImg ||
    !thumbsContainer
  ) {
    return;
  }

  if (
    !images ||
    images.length === 0
  ) {
    mainImg.removeAttribute(
      "src"
    );

    thumbsContainer.innerHTML =
      "";

    return;
  }

  currentImageIndex = 0;

  mainImg.src =
    images[0];

  mainImg.alt =
    `${currentProperty.name} Photo`;

  thumbsContainer.innerHTML =
    "";

  images.forEach(
    (url, index) => {
      const thumb =
        document.createElement(
          "button"
        );

      thumb.type =
        "button";

      thumb.className =
        `thumb-item ${
          index === 0
            ? "active"
            : ""
        }`;

      thumb.setAttribute(
        "aria-label",
        `View photograph ${index + 1}`
      );

      const img =
        document.createElement(
          "img"
        );

      img.src =
        url;

      img.alt =
        `Thumbnail ${index + 1}`;

      thumb.appendChild(
        img
      );

      thumb.addEventListener(
        "click",
        () => {
          setGalleryImage(index);
        }
      );

      thumbsContainer.appendChild(
        thumb
      );
    }
  );
}

function setGalleryImage(index) {
  if (
    !currentProperty ||
    !currentProperty.images
  ) {
    return;
  }

  const images =
    currentProperty.images;

  if (
    index < 0 ||
    index >= images.length
  ) {
    return;
  }

  currentImageIndex =
    index;

  const mainImg =
    document.getElementById(
      "mainGalleryImage"
    );

  if (!mainImg) return;

  mainImg.style.opacity =
    "0.4";

  setTimeout(() => {
    mainImg.src =
      images[currentImageIndex];

    mainImg.style.opacity =
      "1";
  }, 120);

  document
    .querySelectorAll(
      ".thumb-item"
    )
    .forEach(
      (button, buttonIndex) => {
        button.classList.toggle(
          "active",
          buttonIndex ===
            currentImageIndex
        );
      }
    );
}

function initGalleryControls() {
  const prevBtn =
    document.getElementById(
      "prevImageBtn"
    );

  const nextBtn =
    document.getElementById(
      "nextImageBtn"
    );

  if (prevBtn) {
    prevBtn.addEventListener(
      "click",
      () => {
        if (
          !currentProperty ||
          !currentProperty.images?.length
        ) {
          return;
        }

        const total =
          currentProperty.images.length;

        const newIndex =
          (currentImageIndex -
            1 +
            total) %
          total;

        setGalleryImage(
          newIndex
        );
      }
    );
  }

  if (nextBtn) {
    nextBtn.addEventListener(
      "click",
      () => {
        if (
          !currentProperty ||
          !currentProperty.images?.length
        ) {
          return;
        }

        const total =
          currentProperty.images.length;

        const newIndex =
          (currentImageIndex +
            1) %
          total;

        setGalleryImage(
          newIndex
        );
      }
    );
  }
}

// ==========================================
// 10. AMENITIES
// ==========================================
function renderAmenities(
  amenitiesList
) {
  const grid =
    document.getElementById(
      "amenitiesGrid"
    );

  if (!grid) return;

  grid.innerHTML =
    "";

  amenitiesList.forEach(
    (name) => {
      const icon =
        AMENITY_ICONS[name] ||
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "amenity-card-item";

      item.innerHTML =
        `<div class="amenity-icon-box">${icon}</div>`;

      const text =
        document.createElement(
          "span"
        );

      text.textContent =
        name;

      item.appendChild(
        text
      );

      grid.appendChild(
        item
      );
    }
  );
}

// ==========================================
// 11. ROOMS
// ==========================================
function renderRooms(
  roomsList
) {
  const tableBody =
    document.getElementById(
      "roomsTableBody"
    );

  if (!tableBody) return;

  tableBody.innerHTML =
    "";

  if (
    roomsList.length === 0
  ) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          No rooms available for this property.
        </td>
      </tr>
    `;

    return;
  }

  roomsList.forEach(
    (room) => {
      const row =
        document.createElement(
          "tr"
        );

      row.setAttribute(
        "data-room-id",
        room._id
      );

      row.setAttribute(
        "data-room-type",
        room.roomType
      );

      // Room type
      const nameCell =
        document.createElement(
          "td"
        );

      nameCell.className =
        "room-name-cell";

      nameCell.textContent =
        `${room.roomType} Room`;

      row.appendChild(
        nameCell
      );

      // Rent
      const rentCell =
        document.createElement(
          "td"
        );

      rentCell.className =
        "room-rent-cell";

      rentCell.textContent =
        `₹${Number(
          room.rent
        ).toLocaleString("en-IN")}/mo`;

      row.appendChild(
        rentCell
      );

      // Capacity
      const capacityCell =
        document.createElement(
          "td"
        );

      capacityCell.textContent =
        `${room.capacity} Person${
          room.capacity > 1
            ? "s"
            : ""
        }`;

      row.appendChild(
        capacityCell
      );

      // Availability
      const statusCell =
        document.createElement(
          "td"
        );

      const statusBadge =
        document.createElement(
          "span"
        );

      const available =
        room.status === "Available" &&
        room.availableBeds > 0;

      statusBadge.className =
        `status-badge ${
          available
            ? "available"
            : "few-left"
        }`;

      statusBadge.textContent =
        available
          ? `${room.availableBeds} Bed${
              room.availableBeds > 1
                ? "s"
                : ""
            } Available`
          : room.status ===
            "Maintenance"
            ? "Maintenance"
            : "Full";

      statusCell.appendChild(
        statusBadge
      );

      row.appendChild(
        statusCell
      );

      // Action
      const actionCell =
        document.createElement(
          "td"
        );

      actionCell.className =
        "text-right";

      const actionBtn =
        document.createElement(
          "button"
        );

      actionBtn.type =
        "button";

      actionBtn.className =
        "btn btn-outline btn-select-room";

      actionBtn.setAttribute(
        "data-room-id",
        room._id
      );

      actionBtn.setAttribute(
        "data-room-type",
        room.roomType
      );

      actionBtn.setAttribute(
        "data-room-rent",
        room.rent
      );

      if (!available) {
        actionBtn.disabled =
          true;

        actionBtn.textContent =
          "Unavailable";
      } else {
        actionBtn.textContent =
          "Select Room";
      }

      actionCell.appendChild(
        actionBtn
      );

      row.appendChild(
        actionCell
      );

      tableBody.appendChild(
        row
      );
    }
  );

  bindRoomSelectButtons();
}

// ==========================================
// 12. ROOM SELECTION
// ==========================================
function bindRoomSelectButtons() {
  const selectBtns =
    document.querySelectorAll(
      ".btn-select-room"
    );

  const alertBox =
    document.getElementById(
      "selectionAlert"
    );

  const tableRows =
    document.querySelectorAll(
      "#roomsTableBody tr"
    );

  selectBtns.forEach(
    (btn) => {
      btn.addEventListener(
        "click",
        () => {
          const roomId =
            btn.getAttribute(
              "data-room-id"
            );

          const roomType =
            btn.getAttribute(
              "data-room-type"
            );

          const rent =
            Number(
              btn.getAttribute(
                "data-room-rent"
              )
            );

          selectBtns.forEach(
            (button) => {
              if (!button.disabled) {
                button.classList.remove(
                  "selected"
                );

                button.textContent =
                  "Select Room";
              }
            }
          );

          tableRows.forEach(
            (row) => {
              row.classList.remove(
                "selected-row"
              );
            }
          );

          selectedRoom = {
            id: roomId,
            type: roomType,
            rent: rent
          };

          btn.classList.add(
            "selected"
          );

          btn.textContent =
            "Selected ✓";

          const selectedRow =
            btn.closest("tr");

          if (selectedRow) {
            selectedRow.classList.add(
              "selected-row"
            );
          }

          setTextContent(
            "stickyRent",
            `₹${rent.toLocaleString("en-IN")}`
          );

          setTextContent(
            "selectedRoomValue",
            `${roomType} Sharing (₹${rent.toLocaleString("en-IN")}/mo)`
          );

          if (alertBox) {
            alertBox.classList.remove(
              "visible"
            );
          }
        }
      );
    }
  );
}

// ==========================================
// 13. RULES
// ==========================================
function renderRules(
  rulesList
) {
  const listEl =
    document.getElementById(
      "rulesList"
    );

  if (!listEl) return;

  listEl.innerHTML =
    "";

  rulesList.forEach(
    (rule) => {
      const li =
        document.createElement(
          "li"
        );

      li.className =
        "rule-item";

      const dot =
        document.createElement(
          "span"
        );

      dot.className =
        "rule-dot";

      li.appendChild(
        dot
      );

      const text =
        document.createElement(
          "span"
        );

      text.textContent =
        rule;

      li.appendChild(
        text
      );

      listEl.appendChild(
        li
      );
    }
  );
}

// ==========================================
// 14. FAVORITE STATUS
// ==========================================
async function loadFavoriteStatus() {
  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  if (
    !token ||
    !currentProperty
  ) {
    return;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/favorites`,
        {
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
      return;
    }

    isFavorited =
      data.favorites.some(
        (favorite) =>
          favorite.property?._id ===
          currentProperty._id
      );

    updateFavoriteButton();

  } catch (error) {
    console.error(
      "Favorite status error:",
      error
    );
  }
}

// ==========================================
// 15. FAVORITE BUTTON
// ==========================================
function initFavoriteButton() {
  const favBtn =
    document.getElementById(
      "favoriteBtn"
    );

  if (!favBtn) return;

  favBtn.addEventListener(
    "click",
    async () => {
      const token =
        sessionStorage.getItem(
          "pg_token"
        );

      if (!token) {
        alert(
          "Please login to add properties to favorites."
        );

        return;
      }

      if (!currentProperty) {
        return;
      }

      try {
        if (!isFavorited) {
          const response =
            await fetch(
              `${API_BASE_URL}/favorites`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization:
                    `Bearer ${token}`
                },
                body: JSON.stringify({
                  propertyId:
                    currentProperty._id
                })
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
                "Failed to add favorite."
            );

            return;
          }

          isFavorited =
            true;

        } else {
          const response =
            await fetch(
              `${API_BASE_URL}/favorites/${currentProperty._id}`,
              {
                method: "DELETE",
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
                "Failed to remove favorite."
            );

            return;
          }

          isFavorited =
            false;
        }

        updateFavoriteButton();

      } catch (error) {
        console.error(
          "Favorite operation error:",
          error
        );

        alert(
          "Unable to update favorite. Please try again."
        );
      }
    }
  );
}

function updateFavoriteButton() {
  const favBtn =
    document.getElementById(
      "favoriteBtn"
    );

  const favText =
    document.getElementById(
      "favoriteBtnText"
    );

  if (!favBtn) return;

  favBtn.classList.toggle(
    "active",
    isFavorited
  );

  if (favText) {
    favText.textContent =
      isFavorited
        ? "Saved"
        : "Save";
  }
}

// ==========================================
// 16. BOOKING CTA
// ==========================================
function initBookingCTA() {
  const bookBtn =
    document.getElementById(
      "bookRoomBtn"
    );

  const alertBox =
    document.getElementById(
      "selectionAlert"
    );

  const roomsSection =
    document.getElementById(
      "roomsSection"
    );

  if (!bookBtn) return;

  bookBtn.addEventListener(
    "click",
    () => {
      if (!selectedRoom) {
        if (alertBox) {
          alertBox.classList.add(
            "visible"
          );
        }

        if (roomsSection) {
          roomsSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }

        return;
      }

      if (!currentProperty) {
        return;
      }

      const targetUrl =
        `booking.html?id=${encodeURIComponent(
          currentProperty._id
        )}&room=${encodeURIComponent(
          selectedRoom.type
        )}&roomId=${encodeURIComponent(
          selectedRoom.id
        )}`;

      window.location.href =
        targetUrl;
    }
  );
}