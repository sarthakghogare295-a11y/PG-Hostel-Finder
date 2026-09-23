/**
 * PG/Hostel Finder and Room Booking System
 * My Favorites Page Module
 *
 * Favorites are loaded from MongoDB through the backend API.
 */

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initMobileNav();

  const user = checkAuthentication();

  if (!user) return;

  initLogout();

  await loadFavorites();
});

// ==========================================
// 2. AUTHENTICATION & NAVBAR
// ==========================================
function checkAuthentication() {
  const overlay = document.getElementById("authGuardOverlay");
  const main = document.getElementById("favoritesMain");

  let user = null;

  try {
    const rawUser = sessionStorage.getItem("pg_current_user");
    const token = sessionStorage.getItem("pg_token");

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
    console.error("Authentication check failed:", error);
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
      user.name.charAt(0).toUpperCase();
  }

  if (nameEl && user.name) {
    nameEl.textContent =
      user.name.split(" ")[0];
  }

  return user;
}

function showAuthGuard(overlay, main) {
  if (overlay) {
    overlay.classList.add("visible");
  }

  if (main) {
    main.style.display = "none";
  }
}

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

function initLogout() {
  const logoutBtn =
    document.getElementById("logoutBtnNav");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("pg_current_user");
    sessionStorage.removeItem("pg_token");

    window.location.href = "login.html";
  });
}

// ==========================================
// 3. LOAD FAVORITES FROM MONGODB
// ==========================================
async function loadFavorites() {
  const token =
    sessionStorage.getItem("pg_token");

  if (!token) {
    showAuthGuard(
      document.getElementById("authGuardOverlay"),
      document.getElementById("favoritesMain")
    );

    return;
  }

  try {
    const response = await fetch(
      "https://pg-hostel-finder-yevr.onrender.com/api/favorites",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(
        "Failed to load favorites:",
        data.message
      );

      updateFavoritesCount(0);
      renderEmptyState(true);

      return;
    }

    const favorites =
      data.favorites || [];

    console.log(
      "Favorites loaded from MongoDB:",
      favorites
    );

    updateFavoritesCount(
      favorites.length
    );

    if (favorites.length === 0) {
      renderEmptyState(true);
      return;
    }

    renderEmptyState(false);
    renderFavoriteCards(favorites);

  } catch (error) {
    console.error(
      "Favorites loading error:",
      error
    );

    updateFavoritesCount(0);
    renderEmptyState(true);
  }
}

// ==========================================
// 4. REMOVE FAVORITE
// ==========================================
async function removeFavorite(propertyId) {
  const token =
    sessionStorage.getItem("pg_token");

  if (!token) {
    alert("Please login first.");
    return;
  }

  try {
    const response = await fetch(
      `https://pg-hostel-finder-yevr.onrender.com/api/favorites/${propertyId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      alert(
        data.message ||
        "Failed to remove favorite."
      );

      return;
    }

    console.log(
      "Favorite removed:",
      propertyId
    );

    await loadFavorites();

  } catch (error) {
    console.error(
      "Remove favorite error:",
      error
    );

    alert(
      "Unable to remove favorite. Please try again."
    );
  }
}

// ==========================================
// 5. FAVORITES COUNT
// ==========================================
function updateFavoritesCount(count) {
  const countBadge =
    document.getElementById(
      "favoritesCount"
    );

  if (!countBadge) return;

  countBadge.textContent =
    `${count} ${
      count === 1
        ? "Saved"
        : "Saved"
    }`;
}

// ==========================================
// 6. EMPTY STATE
// ==========================================
function renderEmptyState(show) {
  const emptyState =
    document.getElementById(
      "emptyState"
    );

  const grid =
    document.getElementById(
      "favoritesGrid"
    );

  if (emptyState) {
    emptyState.style.display =
      show ? "flex" : "none";
  }

  if (grid) {
    grid.style.display =
      show ? "none" : "grid";

    if (show) {
      grid.innerHTML = "";
    }
  }
}

// ==========================================
// 7. RENDER FAVORITE CARDS
// ==========================================
function renderFavoriteCards(favorites) {
  const grid =
    document.getElementById(
      "favoritesGrid"
    );

  if (!grid) return;

  grid.innerHTML = "";

  favorites.forEach((favorite) => {
    const prop = favorite.property;

    if (!prop) return;

    const card =
      document.createElement("article");

    card.className =
      "property-card";

    // ======================================
    // MEDIA
    // ======================================
    const mediaDiv =
      document.createElement("div");

    mediaDiv.className =
      "property-media";

    const img =
      document.createElement("img");

    img.className =
      "property-image";

    img.src =
      prop.images?.[0] || "";

    img.alt =
      `${prop.name} view`;

    img.loading = "lazy";

    mediaDiv.appendChild(img);

    // Status
    const statusBadge =
      document.createElement("span");

    statusBadge.className =
      "status-badge available";

    statusBadge.textContent =
      prop.status === "Active"
        ? "Available"
        : "Unavailable";

    mediaDiv.appendChild(
      statusBadge
    );

    // Property type
    const propTypeTag =
      document.createElement("span");

    propTypeTag.className =
      "property-type-tag";

    propTypeTag.textContent =
      prop.propertyType || "PG";

    mediaDiv.appendChild(
      propTypeTag
    );

    // Favorite button
    const removeBtn =
      document.createElement("button");

    removeBtn.type = "button";

    removeBtn.className =
      "remove-fav-btn";

    removeBtn.setAttribute(
      "aria-label",
      "Remove from favorites"
    );

    removeBtn.innerHTML = `
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    `;

    removeBtn.addEventListener(
      "click",
      () => {
        removeFavorite(prop._id);
      }
    );

    mediaDiv.appendChild(
      removeBtn
    );

    card.appendChild(
      mediaDiv
    );

    // ======================================
    // DETAILS
    // ======================================
    const detailsDiv =
      document.createElement("div");

    detailsDiv.className =
      "property-details";

    // Title
    const titleWrap =
      document.createElement("div");

    titleWrap.className =
      "property-title-wrap";

    const nameEl =
      document.createElement("h3");

    nameEl.className =
      "property-name";

    nameEl.textContent =
      prop.name;

    titleWrap.appendChild(
      nameEl
    );

    detailsDiv.appendChild(
      titleWrap
    );

    // Location
    const locEl =
      document.createElement("p");

    locEl.className =
      "property-location";

    locEl.innerHTML = `
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `;

    const locationText =
      prop.location
        ? `${prop.location.city || ""}, ${prop.location.state || ""}`
        : "Location unavailable";

    locEl.appendChild(
      document.createTextNode(
        ` ${locationText}`
      )
    );

    detailsDiv.appendChild(
      locEl
    );

    // Amenities
    const featuresEl =
      document.createElement("div");

    featuresEl.className =
      "property-features-inline";

    const amenities =
      prop.facilities || [];

    amenities
      .slice(0, 3)
      .forEach((amenity, index) => {
        featuresEl.appendChild(
          document.createTextNode(
            amenity
          )
        );

        if (
          index <
          Math.min(amenities.length, 3) - 1
        ) {
          featuresEl.appendChild(
            document.createTextNode(" ")
          );

          const separator =
            document.createElement("span");

          separator.textContent = "•";

          featuresEl.appendChild(
            separator
          );

          featuresEl.appendChild(
            document.createTextNode(" ")
          );
        }
      });

    detailsDiv.appendChild(
      featuresEl
    );

    // ======================================
    // PRICE + ACTIONS
    // ======================================
    const bottomDiv =
      document.createElement("div");

    bottomDiv.className =
      "property-card-bottom";

    const priceDiv =
      document.createElement("div");

    priceDiv.className =
      "property-price";

    const priceVal =
      document.createElement("span");

    priceVal.className =
      "price-value";

    priceVal.textContent =
      `₹${formatCurrency(
        prop.rentFrom
      )}`;

    priceDiv.appendChild(
      priceVal
    );

    const pricePeriod =
      document.createElement("span");

    pricePeriod.className =
      "price-period";

    pricePeriod.textContent =
      "/mo";

    priceDiv.appendChild(
      pricePeriod
    );

    bottomDiv.appendChild(
      priceDiv
    );

    const actionsDiv =
      document.createElement("div");

    actionsDiv.className =
      "card-actions";

    const detailsLink =
      document.createElement("a");

    detailsLink.className =
      "btn btn-outline card-btn";

    detailsLink.href =
      `details.html?id=${prop._id}`;

    detailsLink.textContent =
      "View Details";

    actionsDiv.appendChild(
      detailsLink
    );

    const bookLink =
      document.createElement("a");

    bookLink.className =
      "btn btn-primary card-btn";

    bookLink.href =
      `booking.html?id=${prop._id}`;

    bookLink.textContent =
      "Book Now";

    actionsDiv.appendChild(
      bookLink
    );

    bottomDiv.appendChild(
      actionsDiv
    );

    detailsDiv.appendChild(
      bottomDiv
    );

    card.appendChild(
      detailsDiv
    );

    grid.appendChild(
      card
    );
  });
}

// ==========================================
// 8. UTILITY
// ==========================================
function formatCurrency(amount) {
  const num =
    Number(amount) || 0;

  return num.toLocaleString(
    "en-IN"
  );
}