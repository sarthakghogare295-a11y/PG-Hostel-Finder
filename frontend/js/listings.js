/**
 * PG/Hostel Finder and Room Booking System
 * Explore / Listings Page Module (listings.js)
 */

// ==========================================
// 1. DATA REPOSITORY
// ==========================================
let PROPERTIES_DATA = [];

const favoritesSet = new Set();

const activeFilterState = {
  searchQuery: "",
  location: "",
  maxBudget: null,
  roomTypes: [],
  propertyTypes: [],
  amenities: [],
  onlyAvailable: false,
  sortBy: "recommended"
};

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const listingsGrid = document.getElementById("listingsGrid");
const emptyState = document.getElementById("emptyState");
const resultsCountEl = document.getElementById("resultsCount");
const listingsSearchForm = document.getElementById("listingsSearchForm");
const searchInput = document.getElementById("searchInput");
const filterForm = document.getElementById("filterForm");
const locationFilter = document.getElementById("locationFilter");
const budgetFilter = document.getElementById("budgetFilter");
const sortSelect = document.getElementById("sortSelect");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const emptyResetBtn = document.getElementById("emptyResetBtn");
const useMyLocationBtn = document.getElementById("useMyLocationBtn");

const openFiltersBtn = document.getElementById("openFiltersBtn");
const closeFiltersBtn = document.getElementById("closeFiltersBtn");
const filterSidebar = document.getElementById("filterSidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const navToggleBtn = document.getElementById("navToggleBtn");
const navMenu = document.getElementById("navMenu");

// ==========================================
// 3. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initNavbarToggle();
  initDrawerEvents();
  initUrlQuerySync();
  bindFilterEvents();
  initLocationButton();
  initAuthUI();

  await loadProperties();
  await loadFavorites();

  applyFiltersAndRender();
});

// ==========================================
// 4. NAVBAR & DRAWER
// ==========================================
function initNavbarToggle() {
  if (!navToggleBtn || !navMenu) return;

  navToggleBtn.addEventListener("click", () => {
    const isExpanded = navToggleBtn.getAttribute("aria-expanded") === "true";
    navToggleBtn.setAttribute("aria-expanded", String(!isExpanded));
    navMenu.classList.toggle("is-open");
  });
}

function initDrawerEvents() {
  if (!openFiltersBtn || !closeFiltersBtn || !sidebarBackdrop || !filterSidebar) {
    return;
  }

  const openDrawer = () => {
    filterSidebar.classList.add("is-open");
    sidebarBackdrop.classList.add("is-open");
  };

  const closeDrawer = () => {
    filterSidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-open");
  };

  openFiltersBtn.addEventListener("click", openDrawer);
  closeFiltersBtn.addEventListener("click", closeDrawer);
  sidebarBackdrop.addEventListener("click", closeDrawer);
}

// ==========================================
// 5. QUERY SYNC
// ==========================================
function initUrlQuerySync() {
  const params = new URLSearchParams(window.location.search);

  const locationParam = params.get("location");
  const budgetParam = params.get("budget");
  const roomTypeParam = params.get("roomType");

  if (locationParam) {
    activeFilterState.location = locationParam.trim().toLowerCase();
    activeFilterState.searchQuery = locationParam.trim().toLowerCase();

    if (locationFilter) locationFilter.value = locationParam;
    if (searchInput) searchInput.value = locationParam;
  }

  if (budgetParam && !isNaN(parseInt(budgetParam, 10))) {
    activeFilterState.maxBudget = parseInt(budgetParam, 10);

    if (budgetFilter) {
      budgetFilter.value = budgetParam;
    }
  }

  if (roomTypeParam) {
    const normalized = capitalize(roomTypeParam.trim());
    activeFilterState.roomTypes = [normalized];

    const roomTypeCheckboxes =
      document.querySelectorAll('input[name="roomType"]');

    const cb = Array.from(roomTypeCheckboxes).find(
      (input) =>
        input.value.toLowerCase() === normalized.toLowerCase()
    );

    if (cb) cb.checked = true;
  }
}
// ==========================================
// 6. LOCATION
// ==========================================
function initLocationButton() {
  if (!useMyLocationBtn) return;

  useMyLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Location is not supported by this browser.");
      return;
    }

    useMyLocationBtn.disabled = true;
    useMyLocationBtn.textContent = "Getting Location...";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const response = await fetch(
            `https://pg-hostel-finder-yevr.onrender.com/api/properties/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=15000`
          );

          const data = await response.json();

          if (!response.ok || !data.success) {
            alert(data.message || "Unable to find nearby PGs.");
            return;
          }

          await loadNearbyProperties(data.properties);

          activeFilterState.searchQuery = "";
          activeFilterState.location = "";

          if (searchInput) {
            searchInput.value = "";
          }

          if (locationFilter) {
            locationFilter.value = "";
          }

          applyFiltersAndRender();

        } catch (error) {
          console.error("Nearby properties error:", error);
          alert("Unable to find nearby PGs. Please try again.");

        } finally {
          useMyLocationBtn.disabled = false;
          useMyLocationBtn.textContent = "Use My Location";
        }
      },

      (error) => {
        useMyLocationBtn.disabled = false;
        useMyLocationBtn.textContent = "Use My Location";

        if (error.code === 1) {
          alert("Please allow location access to find nearby PGs.");
        } else if (error.code === 2) {
          alert("Your location could not be determined.");
        } else if (error.code === 3) {
          alert("Location request timed out. Please try again.");
        } else {
          alert("Unable to get your location.");
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}
// ==========================================
// 6. FILTER & SEARCH HANDLERS
// ==========================================
function bindFilterEvents() {
  if (listingsSearchForm) {
    listingsSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (searchInput) {
        activeFilterState.searchQuery =
          searchInput.value.trim().toLowerCase();
      }

      applyFiltersAndRender();
    });
  }

  if (filterForm) {
    filterForm.addEventListener("submit", (e) => {
      e.preventDefault();

      syncFiltersFromForm();
      applyFiltersAndRender();

      if (filterSidebar && sidebarBackdrop) {
        filterSidebar.classList.remove("is-open");
        sidebarBackdrop.classList.remove("is-open");
      }
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      activeFilterState.sortBy = e.target.value;
      applyFiltersAndRender();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", resetAllFilters);
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener("click", resetAllFilters);
  }
}

function syncFiltersFromForm() {
  if (locationFilter) {
    activeFilterState.location =
      locationFilter.value.trim().toLowerCase();
  }

  if (budgetFilter) {
    const val = budgetFilter.value;
    activeFilterState.maxBudget = val
      ? parseInt(val, 10)
      : null;
  }

  activeFilterState.roomTypes = Array.from(
    document.querySelectorAll('input[name="roomType"]:checked')
  ).map((el) => el.value);

  activeFilterState.propertyTypes = Array.from(
    document.querySelectorAll('input[name="propertyType"]:checked')
  ).map((el) => el.value);

  activeFilterState.amenities = Array.from(
    document.querySelectorAll('input[name="amenities"]:checked')
  ).map((el) => el.value);

  const availableCheckbox = document.querySelector(
    'input[name="availability"]:checked'
  );

  activeFilterState.onlyAvailable = Boolean(availableCheckbox);
}

function resetAllFilters() {
  if (searchInput) searchInput.value = "";
  if (locationFilter) locationFilter.value = "";
  if (budgetFilter) budgetFilter.value = "";
  if (sortSelect) sortSelect.value = "recommended";

  document
    .querySelectorAll('#filterForm input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = false;
    });

  activeFilterState.searchQuery = "";
  activeFilterState.location = "";
  activeFilterState.maxBudget = null;
  activeFilterState.roomTypes = [];
  activeFilterState.propertyTypes = [];
  activeFilterState.amenities = [];
  activeFilterState.onlyAvailable = false;
  activeFilterState.sortBy = "recommended";

  applyFiltersAndRender();

  if (filterSidebar && sidebarBackdrop) {
    filterSidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-open");
  }
}

// ==========================================
// 7. LOAD PROPERTIES + ROOMS
// ==========================================
async function loadProperties() {
  try {
    const response = await fetch(
      "https://pg-hostel-finder-yevr.onrender.com/api/properties"
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(
        "Failed to load properties:",
        data.message
      );
      return;
    }

    const propertiesWithRooms = await Promise.all(
      data.properties.map(async (property) => {
        let rooms = [];

        try {
          const roomResponse = await fetch(
            `https://pg-hostel-finder-yevr.onrender.com/api/rooms/property/${property._id}`
          );

          const roomData = await roomResponse.json();

          if (roomResponse.ok && roomData.success) {
            rooms = roomData.rooms || [];
          }
        } catch (roomError) {
          console.error(
            `Failed to load rooms for ${property.name}:`,
            roomError
          );
        }

        // Prefer an available room
        const selectedRoom =
          rooms.find(
            (room) =>
              room.status === "Available" &&
              room.availableBeds > 0
          ) || rooms[0];

        return {
          id: property._id,
          name: property.name,
          location: `${property.location.address}, ${property.location.city}, ${property.location.state}`,

          price:
            selectedRoom?.rent ??
            property.rentFrom,

          propertyType: property.propertyType,

          roomType:
            selectedRoom?.roomType ||
            "Not Specified",

          availableBeds:
            selectedRoom?.availableBeds ?? 0,

          roomStatus:
            selectedRoom?.status ||
            "Unavailable",

          amenities:
            property.facilities || [],

          availability:
            selectedRoom &&
            selectedRoom.availableBeds > 0
              ? "Available"
              : "Unavailable",

          image:
            property.images?.[0] || "",

          dateAdded:
            new Date(property.createdAt).getTime(),

          // Keep actual backend data available
          originalProperty: property,
          rooms: rooms
        };
      })
    );

    PROPERTIES_DATA = propertiesWithRooms;

  } catch (error) {
    console.error(
      "Property loading error:",
      error
    );
  }
}

async function loadNearbyProperties(properties) {
  const propertiesWithRooms = await Promise.all(
    properties.map(async (property) => {
      let rooms = [];

      try {
        const roomResponse = await fetch(
          `https://pg-hostel-finder-yevr.onrender.com/api/rooms/property/${property._id}`
        );

        const roomData = await roomResponse.json();

        if (roomResponse.ok && roomData.success) {
          rooms = roomData.rooms || [];
        }
      } catch (error) {
        console.error(
          `Failed to load rooms for ${property.name}:`,
          error
        );
      }

      const selectedRoom =
        rooms.find(
          (room) =>
            room.status === "Available" &&
            room.availableBeds > 0
        ) || rooms[0];

      return {
        id: property._id,
        name: property.name,
        location: `${property.location.city}, ${property.location.state}`,

        price:
          selectedRoom?.rent ??
          property.rentFrom,

        propertyType: property.propertyType,

        roomType:
          selectedRoom?.roomType ||
          "Not Specified",

        availableBeds:
          selectedRoom?.availableBeds ?? 0,

        roomStatus:
          selectedRoom?.status ||
          "Unavailable",

        amenities:
          property.facilities || [],

        availability:
          selectedRoom &&
          selectedRoom.availableBeds > 0
            ? "Available"
            : "Unavailable",

        image:
          property.images?.[0] || "",

        dateAdded:
          new Date(property.createdAt).getTime(),

        originalProperty: property,
        rooms: rooms
      };
    })
  );

  PROPERTIES_DATA = propertiesWithRooms;
}

// ==========================================
// 8. LOAD USER FAVORITES
// ==========================================
async function loadFavorites() {
  const token = sessionStorage.getItem("pg_token");

  // User is not logged in
  if (!token) {
    favoritesSet.clear();
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
      return;
    }

    favoritesSet.clear();

    data.favorites.forEach((favorite) => {
      if (favorite.property?._id) {
        favoritesSet.add(favorite.property._id);
      }
    });

  } catch (error) {
    console.error(
      "Favorites loading error:",
      error
    );
  }
}

// ==========================================
// 9. FILTER LOGIC & RENDERING
// ==========================================
function applyFiltersAndRender() {
  let results = [...PROPERTIES_DATA];

  if (activeFilterState.searchQuery) {
    const q = activeFilterState.searchQuery;

    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
    );
  }

  if (activeFilterState.location) {
    const loc = activeFilterState.location;

    results = results.filter(
      (item) =>
        item.location.toLowerCase().includes(loc)
    );
  }

  if (activeFilterState.maxBudget) {
    results = results.filter(
      (item) =>
        item.price <= activeFilterState.maxBudget
    );
  }

  if (activeFilterState.roomTypes.length > 0) {
    const selectedNormalized =
      activeFilterState.roomTypes.map((t) =>
        t.toLowerCase()
      );

    results = results.filter((item) =>
      selectedNormalized.includes(
        item.roomType.toLowerCase()
      )
    );
  }

  if (activeFilterState.propertyTypes.length > 0) {
    results = results.filter((item) =>
      activeFilterState.propertyTypes.includes(
        item.propertyType
      )
    );
  }

  if (activeFilterState.amenities.length > 0) {
    results = results.filter((item) =>
      activeFilterState.amenities.every(
        (amenity) =>
          item.amenities.includes(amenity)
      )
    );
  }

  if (activeFilterState.onlyAvailable) {
    results = results.filter(
      (item) =>
        item.availability === "Available"
    );
  }

  sortResults(
    results,
    activeFilterState.sortBy
  );

  updateResultsCount(results.length);
  renderCards(results);
}

// ==========================================
// 10. SORTING
// ==========================================
function sortResults(list, sortOrder) {
  switch (sortOrder) {
    case "price-low":
      list.sort(
        (a, b) => a.price - b.price
      );
      break;

    case "price-high":
      list.sort(
        (a, b) => b.price - a.price
      );
      break;

    case "newest":
      list.sort(
        (a, b) => b.dateAdded - a.dateAdded
      );
      break;

    default:
      list.sort((a, b) =>
        String(a.id).localeCompare(
          String(b.id)
        )
      );
      break;
  }
}

// ==========================================
// 11. RESULTS COUNT
// ==========================================
function updateResultsCount(count) {
  if (!resultsCountEl) return;

  resultsCountEl.textContent =
    `${count} ${
      count === 1
        ? "PG or Hostel"
        : "PGs & Hostels"
    } Found`;
}

// ==========================================
// 12. RENDER PROPERTY CARDS
// ==========================================
function renderCards(list) {
  if (!listingsGrid) return;

  listingsGrid.innerHTML = "";

  if (list.length === 0) {
    if (emptyState) {
      emptyState.classList.add("visible");
    }

    return;
  }

  if (emptyState) {
    emptyState.classList.remove("visible");
  }

  list.forEach((prop) => {
    const isFav =
      favoritesSet.has(prop.id);

    // ======================================
    // MAIN CARD
    // ======================================
    const card =
      document.createElement("article");

    card.className =
      "property-card";

    card.setAttribute(
      "data-property-id",
      prop.id
    );

    // ======================================
    // MEDIA SECTION
    // ======================================
    const mediaDiv =
      document.createElement("div");

    mediaDiv.className =
      "property-media";

    const img =
      document.createElement("img");

    img.className =
      "property-image";

    img.src = prop.image;

    img.alt =
      `${prop.name} interior`;

    img.loading = "lazy";

    mediaDiv.appendChild(img);

    // ======================================
    // STATUS BADGE
    // ======================================
    const statusBadge =
      document.createElement("span");

    statusBadge.className =
      `status-badge ${
        prop.availability === "Available"
          ? "available"
          : "few-left"
      }`;

    statusBadge.textContent =
      prop.availability;

    mediaDiv.appendChild(
      statusBadge
    );

    // ======================================
    // PROPERTY TYPE
    // ======================================
    const typeTag =
      document.createElement("span");

    typeTag.className =
      "property-type-tag";

    typeTag.textContent =
      prop.propertyType;

    mediaDiv.appendChild(
      typeTag
    );

    // ======================================
    // FAVORITE BUTTON
    // ======================================
    const favBtn =
      document.createElement("button");

    favBtn.type = "button";

    favBtn.className =
      `favorite-btn ${
        isFav ? "active" : ""
      }`;

    favBtn.setAttribute(
      "data-favorite-id",
      prop.id
    );

    favBtn.setAttribute(
      "aria-label",
      "Save to favorites"
    );

    const svgFav =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );

    svgFav.setAttribute(
      "width",
      "18"
    );

    svgFav.setAttribute(
      "height",
      "18"
    );

    svgFav.setAttribute(
      "viewBox",
      "0 0 24 24"
    );

    svgFav.setAttribute(
      "fill",
      "none"
    );

    svgFav.setAttribute(
      "stroke",
      "currentColor"
    );

    svgFav.setAttribute(
      "stroke-width",
      "2"
    );

    svgFav.setAttribute(
      "stroke-linecap",
      "round"
    );

    svgFav.setAttribute(
      "stroke-linejoin",
      "round"
    );

    const pathFav =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

    pathFav.setAttribute(
      "d",
      "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
    );

    svgFav.appendChild(
      pathFav
    );

    favBtn.appendChild(
      svgFav
    );

    mediaDiv.appendChild(
      favBtn
    );

    // ======================================
    // ROOM TYPE
    // ======================================
    const roomTag =
      document.createElement("span");

    roomTag.className =
      "room-type-tag";

    roomTag.textContent =
      `${prop.roomType} Sharing`;

    mediaDiv.appendChild(
      roomTag
    );

    card.appendChild(
      mediaDiv
    );

    // ======================================
    // DETAILS SECTION
    // ======================================
    const detailsDiv =
      document.createElement("div");

    detailsDiv.className =
      "property-details";

    // PROPERTY NAME
    const nameEl =
      document.createElement("h3");

    nameEl.className =
      "property-name";

    nameEl.textContent =
      prop.name;

    detailsDiv.appendChild(
      nameEl
    );

    // LOCATION
    const locEl =
      document.createElement("p");

    locEl.className =
      "property-location";

    const svgLoc =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );

    svgLoc.setAttribute(
      "width",
      "14"
    );

    svgLoc.setAttribute(
      "height",
      "14"
    );

    svgLoc.setAttribute(
      "viewBox",
      "0 0 24 24"
    );

    svgLoc.setAttribute(
      "fill",
      "none"
    );

    svgLoc.setAttribute(
      "stroke",
      "currentColor"
    );

    svgLoc.setAttribute(
      "stroke-width",
      "2"
    );

    svgLoc.setAttribute(
      "stroke-linecap",
      "round"
    );

    svgLoc.setAttribute(
      "stroke-linejoin",
      "round"
    );

    svgLoc.setAttribute(
      "aria-hidden",
      "true"
    );

    const pathLoc =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

    pathLoc.setAttribute(
      "d",
      "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
    );

    svgLoc.appendChild(
      pathLoc
    );

    const circleLoc =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );

    circleLoc.setAttribute(
      "cx",
      "12"
    );

    circleLoc.setAttribute(
      "cy",
      "10"
    );

    circleLoc.setAttribute(
      "r",
      "3"
    );

    svgLoc.appendChild(
      circleLoc
    );

    locEl.appendChild(
      svgLoc
    );

    locEl.appendChild(
      document.createTextNode(
        ` ${prop.location}`
      )
    );

    detailsDiv.appendChild(
      locEl
    );

    // ======================================
    // AMENITIES
    // ======================================
    const featuresEl =
      document.createElement("div");

    featuresEl.className =
      "property-features-inline";

    const topAmenities =
      prop.amenities.slice(0, 3);

    topAmenities.forEach(
      (amenity, idx) => {
        featuresEl.appendChild(
          document.createTextNode(
            amenity
          )
        );

        if (
          idx <
          topAmenities.length - 1
        ) {
          featuresEl.appendChild(
            document.createTextNode(" ")
          );

          const sep =
            document.createElement(
              "span"
            );

          sep.textContent = "•";

          featuresEl.appendChild(
            sep
          );

          featuresEl.appendChild(
            document.createTextNode(" ")
          );
        }
      }
    );

    detailsDiv.appendChild(
      featuresEl
    );

    // ======================================
    // PRICE & DETAILS LINK
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
      `₹${prop.price.toLocaleString(
        "en-IN"
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

    const viewLink =
      document.createElement("a");

    viewLink.href =
      `details.html?id=${prop.id}`;

    viewLink.className =
      "btn btn-secondary card-btn";

    viewLink.textContent =
      "View Details";

    bottomDiv.appendChild(
      viewLink
    );

    detailsDiv.appendChild(
      bottomDiv
    );

    card.appendChild(
      detailsDiv
    );

    listingsGrid.appendChild(
      card
    );
  });

  bindFavoriteButtons();
}

// ==========================================
// 13. FAVORITE BUTTONS
// ==========================================
function bindFavoriteButtons() {
  if (!listingsGrid) return;

  // Prevent duplicate event listener
  if (listingsGrid.dataset.favoriteListenerBound === "true") {
    return;
  }

  listingsGrid.dataset.favoriteListenerBound = "true";

  listingsGrid.addEventListener("click", async (e) => {
    const btn = e.target.closest(".favorite-btn");

    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const token = sessionStorage.getItem("pg_token");

    if (!token) {
      alert("Please login to add properties to favorites.");
      return;
    }

    const propertyId = btn.getAttribute("data-favorite-id");

    if (!propertyId) {
      console.error("Favorite button has no property ID.");
      return;
    }

    const isFavorite = favoritesSet.has(propertyId);

    try {
      // ==================================
      // ADD FAVORITE
      // ==================================
      if (!isFavorite) {
        const response = await fetch(
          "https://pg-hostel-finder-yevr.onrender.com/api/favorites",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              propertyId: propertyId
            })
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          alert(
            data.message || "Failed to add favorite."
          );
          return;
        }

        favoritesSet.add(propertyId);
        btn.classList.add("active");

        console.log("Favorite added successfully:", propertyId);

      // ==================================
      // REMOVE FAVORITE
      // ==================================
      } else {
        const response = await fetch(
          `https://pg-hostel-finder-yevr.onrender.com/api/favorites/${propertyId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          alert(
            data.message || "Failed to remove favorite."
          );
          return;
        }

        favoritesSet.delete(propertyId);
        btn.classList.remove("active");

        console.log("Favorite removed successfully:", propertyId);
      }

    } catch (error) {
      console.error("Favorite operation error:", error);

      alert(
        "Unable to update favorite. Please try again."
      );
    }
  });
}

// ==========================================
// 14. HELPER
// ==========================================
function capitalize(str) {
  if (!str) return "";

  return (
    str.charAt(0).toUpperCase() +
    str.slice(1).toLowerCase()
  );
}

function initAuthUI() {
  const navActions = document.querySelector(".nav-actions");

  if (!navActions) return;

  const token = sessionStorage.getItem("pg_token");
  const currentUser = sessionStorage.getItem("pg_current_user");

  if (!token) {
    return;
  }

  let user = null;

  try {
    user = currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error("Failed to read current user:", error);
  }

  const userName = user?.name || "Account";

  navActions.innerHTML = `
    <a href="profile.html" class="btn btn-login">
      ${userName}
    </a>

    <button type="button" class="btn btn-register" id="logoutBtn">
      Logout
    </button>
  `;

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("pg_token");
      sessionStorage.removeItem("pg_current_user");

      window.location.href = "login.html";
    });
  }
}