/**
 * PG/Hostel Finder Admin Dashboard
 * Backend + MongoDB Integrated Version
 */

const API_BASE_URL = "https://pg-hostel-finder-yevr.onrender.com/api";

let dashboardProperties = [];
let dashboardRooms = [];
let dashboardBookings = [];
let dashboardUsers = [];

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  const user = checkAdminAuth();

  if (!user) return;

  initSidebar();
  initLogout();
  setupAdminProfile(user);

  await loadDashboardData();
});

// ==========================================
// 2. ADMIN AUTHENTICATION
// ==========================================
function checkAdminAuth() {
  const content =
    document.getElementById("adminContent");

  let user = null;

  try {
    const raw =
      sessionStorage.getItem(
        "pg_current_user"
      );

    const token =
      sessionStorage.getItem(
        "pg_token"
      );

    if (!raw || !token) {
      window.location.href =
        "../login.html";
      return null;
    }

    user = JSON.parse(raw);

    if (
      !user ||
      user.role !== "admin"
    ) {
      window.location.href =
        "../login.html";
      return null;
    }

  } catch (error) {
    console.error(
      "Admin authentication error:",
      error
    );

    window.location.href =
      "../login.html";

    return null;
  }

  if (content) {
    content.style.display =
      "block";
  }

  return user;
}

// ==========================================
// 3. ADMIN PROFILE
// ==========================================
function setupAdminProfile(user) {
  const avatar =
    document.getElementById(
      "topbarAvatar"
    );

  const name =
    document.getElementById(
      "topbarName"
    );

  if (avatar && user.name) {
    avatar.textContent =
      user.name
        .charAt(0)
        .toUpperCase();
  }

  if (name && user.name) {
    name.textContent =
      user.name;
  }
}

// ==========================================
// 4. LOGOUT
// ==========================================
function initLogout() {
  const logoutBtn =
    document.getElementById(
      "adminLogoutBtn"
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

      window.location.href =
        "../login.html";
    }
  );
}

// ==========================================
// 5. SIDEBAR
// ==========================================
function initSidebar() {
  const toggleBtn =
    document.getElementById(
      "adminMenuBtn"
    );

  const closeBtn =
    document.getElementById(
      "sidebarCloseBtn"
    );

  const sidebar =
    document.getElementById(
      "adminSidebar"
    );

  const backdrop =
    document.getElementById(
      "sidebarBackdrop"
    );

  if (
    !toggleBtn ||
    !sidebar ||
    !backdrop ||
    !closeBtn
  ) {
    return;
  }

  const openSidebar = () => {
    sidebar.classList.add(
      "is-open"
    );

    backdrop.classList.add(
      "is-open"
    );
  };

  const closeSidebar = () => {
    sidebar.classList.remove(
      "is-open"
    );

    backdrop.classList.remove(
      "is-open"
    );
  };

  toggleBtn.addEventListener(
    "click",
    openSidebar
  );

  closeBtn.addEventListener(
    "click",
    closeSidebar
  );

  backdrop.addEventListener(
    "click",
    closeSidebar
  );
}

// ==========================================
// 6. LOAD DASHBOARD DATA
// ==========================================
async function loadDashboardData() {
  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  if (!token) return;

  try {
    // --------------------------------------
    // Load properties
    // --------------------------------------
    const propertyResponse =
      await fetch(
        `${API_BASE_URL}/properties`
      );

    const propertyData =
      await propertyResponse.json();

    if (
      !propertyResponse.ok ||
      !propertyData.success
    ) {
      throw new Error(
        propertyData.message ||
        "Failed to load properties"
      );
    }

    dashboardProperties =
      propertyData.properties || [];

    // --------------------------------------
    // Load rooms for every property
    // --------------------------------------
    dashboardRooms = [];

    for (
      const property
      of dashboardProperties
    ) {
      try {
        const roomResponse =
          await fetch(
            `${API_BASE_URL}/rooms/property/${property._id}`
          );

        const roomData =
          await roomResponse.json();

        if (
          roomResponse.ok &&
          roomData.success
        ) {
          dashboardRooms.push(
            ...(roomData.rooms || [])
          );
        }

      } catch (error) {
        console.error(
          "Failed to load rooms for property:",
          property._id,
          error
        );
      }
    }

    // --------------------------------------
    // Load all bookings
    // --------------------------------------
    const bookingResponse =
      await fetch(
        `${API_BASE_URL}/bookings/admin/all`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const bookingData =
      await bookingResponse.json();

    if (
      !bookingResponse.ok ||
      !bookingData.success
    ) {
      throw new Error(
        bookingData.message ||
        "Failed to load bookings"
      );
    }

    dashboardBookings =
      bookingData.bookings || [];

    // --------------------------------------
    // Load registered users
    // --------------------------------------
    const userResponse =
      await fetch(
        `${API_BASE_URL}/users/admin/all`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const userData =
      await userResponse.json();

    if (
      !userResponse.ok ||
      !userData.success
    ) {
      throw new Error(
        userData.message ||
        "Failed to load users"
      );
    }

    dashboardUsers =
      userData.users || [];

    // --------------------------------------
    // Render dashboard
    // --------------------------------------
    renderStats();

    renderRecentBookings();

    renderRecentProperties();

    renderActivities();

  } catch (error) {
    console.error(
      "Dashboard data loading error:",
      error
    );

    showDashboardError(
      "Unable to load dashboard data. Please refresh the page."
    );
  }
}

// ==========================================
// 7. DASHBOARD ERROR
// ==========================================
function showDashboardError(
  message
) {
  console.error(message);
}

// ==========================================
// 8. STATISTICS
// ==========================================
function renderStats() {
  const grid =
    document.getElementById(
      "statsGrid"
    );

  if (!grid) return;

  const totalProperties =
    dashboardProperties.length;

  const totalRooms =
    dashboardRooms.length;

  const totalBookings =
    dashboardBookings.length;

  const registeredUsers =
    dashboardUsers.length;

  const pendingBookings =
    dashboardBookings.filter(
      (booking) => {
        const status =
          (
            booking.status ||
            "Requested"
          ).toLowerCase();

        return (
          status === "requested" ||
          status === "pending"
        );
      }
    ).length;

  const availableProperties =
    dashboardProperties.filter(
      (property) =>
        property.status ===
        "Active"
    ).length;

  const statsData = [
    {
      label:
        "Total Properties",

      value:
        totalProperties,

      icon:
        `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>`,

      colorClass:
        "bg-blue"
    },

    {
      label:
        "Total Room Types",

      value:
        totalRooms,

      icon:
        `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <path d="M3 9h18M9 21V9"></path>
        </svg>`,

      colorClass:
        "bg-purple"
    },

    {
      label:
        "Registered Users",

      value:
        registeredUsers,

      icon:
        `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>`,

      colorClass:
        "bg-teal"
    },

    {
      label:
        "Total Bookings",

      value:
        totalBookings,

      icon:
        `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>`,

      colorClass:
        "bg-green"
    },

    {
      label:
        "Pending Bookings",

      value:
        pendingBookings,

      icon:
        `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`,

      colorClass:
        "bg-amber"
    },

    {
      label:
        "Properties w/ Vacancy",

      value:
        availableProperties,

      icon:
        `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`,

      colorClass:
        "bg-red"
    }
  ];

  grid.innerHTML =
    statsData
      .map(
        (stat) => `
          <div class="admin-stat-card">

            <div class="stat-icon-wrap ${stat.colorClass}">
              ${stat.icon}
            </div>

            <div class="stat-content">
              <h4>${stat.label}</h4>
              <span class="stat-number">
                ${stat.value}
              </span>
            </div>

          </div>
        `
      )
      .join("");
}

// ==========================================
// 9. RECENT BOOKINGS
// ==========================================
function renderRecentBookings() {
  const tbody =
    document.getElementById(
      "recentBookingsTable"
    );

  if (!tbody) return;

  tbody.innerHTML = "";

  if (
    dashboardBookings.length === 0
  ) {
    const tr =
      document.createElement(
        "tr"
      );

    const td =
      document.createElement(
        "td"
      );

    td.colSpan = 7;

    td.style.textAlign =
      "center";

    td.style.padding =
      "20px";

    td.textContent =
      "No bookings found.";

    tr.appendChild(td);

    tbody.appendChild(tr);

    return;
  }

  const recentBookings =
    [...dashboardBookings]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ) -
          new Date(
            a.createdAt
          )
      )
      .slice(0, 5);

  recentBookings.forEach(
    (booking) => {
      const status =
        (
          booking.status ||
          "Requested"
        ).toLowerCase();

      const isPending =
        status === "requested" ||
        status === "pending";

      const statusClass =
        status === "cancelled"
          ? "status-full"
          : isPending
            ? "status-pending"
            : "status-confirmed";

      const property =
        booking.property || {};

      const room =
        booking.room || {};

      const user =
        booking.user || {};

      const tr =
        document.createElement(
          "tr"
        );

      // Booking ID
      const tdId =
        document.createElement(
          "td"
        );

      tdId.className =
        "table-id";

      tdId.textContent =
        booking.bookingId || "—";

      tr.appendChild(tdId);

      // Guest
      const tdGuest =
        document.createElement(
          "td"
        );

      tdGuest.textContent =
        user.name || "—";

      tr.appendChild(tdGuest);

      // Property
      const tdProperty =
        document.createElement(
          "td"
        );

      tdProperty.textContent =
        property.name || "—";

      tr.appendChild(
        tdProperty
      );

      // Room
      const tdRoom =
        document.createElement(
          "td"
        );

      tdRoom.textContent =
        room.roomType || "—";

      tr.appendChild(tdRoom);

      // Date
      const tdDate =
        document.createElement(
          "td"
        );

      tdDate.textContent =
        formatSafeDate(
          booking.checkIn
        );

      tr.appendChild(tdDate);

      // Status
      const tdStatus =
        document.createElement(
          "td"
        );

      const statusBadge =
        document.createElement(
          "span"
        );

      statusBadge.className =
        `status-badge ${statusClass}`;

      statusBadge.textContent =
        booking.status ||
        "Requested";

      tdStatus.appendChild(
        statusBadge
      );

      tr.appendChild(
        tdStatus
      );

      // Actions
      const tdActions =
        document.createElement(
          "td"
        );

      const actionGroup =
        document.createElement(
          "div"
        );

      actionGroup.className =
        "action-btn-group";

      if (isPending) {
        const confirmBtn =
          document.createElement(
            "button"
          );

        confirmBtn.className =
          "btn-action-small success";

        confirmBtn.title =
          "Confirm Booking";

        confirmBtn.innerHTML =
          `<svg width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>`;

        confirmBtn.addEventListener(
          "click",
          () =>
            updateBookingStatus(
              booking._id,
              "Confirmed"
            )
        );

        actionGroup.appendChild(
          confirmBtn
        );
      }

      if (
        status !==
        "cancelled"
      ) {
        const cancelBtn =
          document.createElement(
            "button"
          );

        cancelBtn.className =
          "btn-action-small danger";

        cancelBtn.title =
          "Cancel Booking";

        cancelBtn.innerHTML =
          `<svg width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>`;

        cancelBtn.addEventListener(
          "click",
          () =>
            updateBookingStatus(
              booking._id,
              "Cancelled"
            )
        );

        actionGroup.appendChild(
          cancelBtn
        );
      }

      tdActions.appendChild(
        actionGroup
      );

      tr.appendChild(
        tdActions
      );

      tbody.appendChild(tr);
    }
  );
}

// ==========================================
// 10. RECENT PROPERTIES
// ==========================================
function renderRecentProperties() {
  const tbody =
    document.getElementById(
      "recentPropertiesTable"
    );

  if (!tbody) return;

  tbody.innerHTML = "";

  const recentProperties =
    dashboardProperties.slice(
      0,
      4
    );

  recentProperties.forEach(
    (property) => {
      const tr =
        document.createElement(
          "tr"
        );

      const tdName =
        document.createElement(
          "td"
        );

      tdName.className =
        "table-id";

      tdName.textContent =
        property.name || "—";

      tr.appendChild(tdName);

      const tdLocation =
        document.createElement(
          "td"
        );

      tdLocation.textContent =
        getPropertyLocation(
          property
        );

      tr.appendChild(
        tdLocation
      );

      const tdType =
        document.createElement(
          "td"
        );

      tdType.textContent =
        property.propertyType ||
        "—";

      tr.appendChild(
        tdType
      );

      const propertyRooms =
        dashboardRooms.filter(
          (room) =>
            String(
              room.property
            ) ===
            String(
              property._id
            )
        );

      const tdRooms =
        document.createElement(
          "td"
        );

      tdRooms.textContent =
        `${propertyRooms.length} Types`;

      tr.appendChild(
        tdRooms
      );

      const tdStatus =
        document.createElement(
          "td"
        );

      const statusBadge =
        document.createElement(
          "span"
        );

      statusBadge.className =
        `status-badge ${
          property.status ===
          "Active"
            ? "status-active"
            : "status-full"
        }`;

      statusBadge.textContent =
        property.status ||
        "—";

      tdStatus.appendChild(
        statusBadge
      );

      tr.appendChild(
        tdStatus
      );

      const tdActions =
        document.createElement(
          "td"
        );

      const actionGroup =
        document.createElement(
          "div"
        );

      actionGroup.className =
        "action-btn-group";

      const viewLink =
        document.createElement(
          "a"
        );

      viewLink.href =
        `../../details.html?id=${encodeURIComponent(
          property._id
        )}`;

      viewLink.target =
        "_blank";

      viewLink.className =
        "btn-action-small";

      viewLink.title =
        "View Property";

      viewLink.innerHTML =
        `<svg width="14" height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">
          <path d="M1 12s4-8 11-8
          11 8 11 8-4 8-11 8-11-8-11-8z">
          </path>
          <circle cx="12" cy="12" r="3">
          </circle>
        </svg>`;

      actionGroup.appendChild(
        viewLink
      );

      tdActions.appendChild(
        actionGroup
      );

      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  );
}

// ==========================================
// 11. ACTIVITY FEED
// ==========================================
function renderActivities() {
  const feed =
    document.getElementById(
      "activityFeed"
    );

  if (!feed) return;

  const activities =
    dashboardBookings
      .filter(
        (booking) =>
          booking.createdAt
      )
      .map(
        (booking) => ({
          timeValue:
            new Date(
              booking.createdAt
            ).getTime(),

          guestName:
            booking.user?.name ||
            "User",

          bookingId:
            booking.bookingId ||
            "—",

          propertyName:
            booking.property?.name ||
            "Property",

          timeStr:
            formatSafeDate(
              booking.createdAt,
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              }
            )
        })
      )
      .sort(
        (a, b) =>
          b.timeValue -
          a.timeValue
      );

  feed.innerHTML = "";

  if (
    activities.length === 0
  ) {
    const p =
      document.createElement(
        "p"
      );

    p.style.fontSize =
      "0.85rem";

    p.style.color =
      "var(--text-muted)";

    p.textContent =
      "No recent activity on the platform.";

    feed.appendChild(p);

    return;
  }

  activities
    .slice(0, 5)
    .forEach(
      (activity) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "activity-item";

        const iconDiv =
          document.createElement(
            "div"
          );

        iconDiv.className =
          "activity-icon bg-blue";

        iconDiv.innerHTML =
          `<svg fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24">
            <rect x="3" y="4"
              width="18" height="18"
              rx="2"></rect>
            <line x1="16" y1="2"
              x2="16" y2="6"></line>
            <line x1="8" y1="2"
              x2="8" y2="6"></line>
            <line x1="3" y1="10"
              x2="21" y2="10"></line>
          </svg>`;

        const content =
          document.createElement(
            "div"
          );

        content.className =
          "activity-content";

        const text =
          document.createElement(
            "p"
          );

        text.className =
          "activity-text";

        const guest =
          document.createElement(
            "strong"
          );

        guest.textContent =
          activity.guestName;

        text.appendChild(
          guest
        );

        text.appendChild(
          document.createTextNode(
            ` created booking ${activity.bookingId} at ${activity.propertyName}.`
          )
        );

        const time =
          document.createElement(
            "span"
          );

        time.className =
          "activity-time";

        time.textContent =
          activity.timeStr;

        content.appendChild(
          text
        );

        content.appendChild(
          time
        );

        item.appendChild(
          iconDiv
        );

        item.appendChild(
          content
        );

        feed.appendChild(
          item
        );
      }
    );
}

// ==========================================
// 12. ADMIN BOOKING STATUS UPDATE
// ==========================================
async function updateBookingStatus(
  bookingId,
  newStatus
) {
  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  if (!token) {
    window.location.href =
      "../login.html";

    return;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/bookings/admin/${bookingId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              status:
                newStatus
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
        "Unable to update booking."
      );

      return;
    }

    // Reload fresh MongoDB data
    await loadDashboardData();

  } catch (error) {
    console.error(
      "Booking status update error:",
      error
    );

    alert(
      "Unable to update booking. Please try again."
    );
  }
}

// ==========================================
// 13. HELPERS
// ==========================================
function getPropertyLocation(
  property
) {
  const location =
    property?.location;

  if (!location) {
    return "—";
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

  return "—";
}

function formatSafeDate(
  dateString,
  formatOpts = {
    day: "numeric",
    month: "short",
    year: "numeric"
  }
) {
  if (!dateString) {
    return "—";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    formatOpts
  );
}



