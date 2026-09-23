/**
 * PG/Hostel Finder Admin Users Module
 * Backend + MongoDB Integrated Version
 */

const API_BASE_URL = "https://pg-hostel-finder-yevr.onrender.com/api";

let usersStore = [];
let bookingsStore = [];

let deleteTargetId = null;
let lastFocusedElement = null;


// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  const user = checkAdminAuth();

  if (!user) return;

  initSidebar();
  initLogout();
  setupAdminProfile(user);

  bindFilterEvents();
  bindModalEvents();

  await loadUsersData();
});


// ==========================================
// 2. AUTHENTICATION
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
  safelySetTextContent(
    "topbarAvatar",
    getSafeString(
      user.name,
      "A"
    )
      .charAt(0)
      .toUpperCase()
  );

  safelySetTextContent(
    "topbarName",
    getSafeString(
      user.name,
      "Admin User"
    )
  );
}


// ==========================================
// 4. LOGOUT
// ==========================================
function initLogout() {
  bindSafeEvent(
    "adminLogoutBtn",
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
  const sidebar =
    document.getElementById(
      "adminSidebar"
    );

  const backdrop =
    document.getElementById(
      "sidebarBackdrop"
    );

  const openSidebar = () => {
    if (sidebar) {
      sidebar.classList.add(
        "is-open"
      );
    }

    if (backdrop) {
      backdrop.classList.add(
        "is-open"
      );
    }
  };

  const closeSidebar = () => {
    if (sidebar) {
      sidebar.classList.remove(
        "is-open"
      );
    }

    if (backdrop) {
      backdrop.classList.remove(
        "is-open"
      );
    }
  };

  bindSafeEvent(
    "adminMenuBtn",
    "click",
    openSidebar
  );

  bindSafeEvent(
    "sidebarCloseBtn",
    "click",
    closeSidebar
  );

  bindSafeEvent(
    "sidebarBackdrop",
    "click",
    closeSidebar
  );
}


// ==========================================
// 6. LOAD USERS + BOOKINGS
// ==========================================
async function loadUsersData() {
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

    // --------------------------------------
    // Load users from MongoDB
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

    usersStore =
      userData.users || [];


    // --------------------------------------
    // Load bookings from MongoDB
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

    bookingsStore =
      bookingData.bookings || [];


    // --------------------------------------
    // Render page
    // --------------------------------------
    updateDashboard();

  } catch (error) {
    console.error(
      "Failed to load users data:",
      error
    );

    showPageError(
      "Unable to load users. Please refresh the page."
    );
  }
}


// ==========================================
// 7. REFRESH USERS
// ==========================================
async function refreshUsersData() {
  await loadUsersData();
}


// ==========================================
// 8. ERROR MESSAGE
// ==========================================
function showPageError(message) {
  console.error(message);

  const tbody =
    document.getElementById(
      "usersTableBody"
    );

  if (!tbody) return;

  tbody.innerHTML = "";

  const tr =
    document.createElement(
      "tr"
    );

  const td =
    document.createElement(
      "td"
    );

  td.colSpan = 6;

  td.style.textAlign =
    "center";

  td.style.padding =
    "30px";

  td.textContent =
    message;

  tr.appendChild(td);

  tbody.appendChild(tr);
}


// ==========================================
// 9. SAFE UTILITIES
// ==========================================
function getSafeString(
  value,
  fallback = ""
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return (
    String(value).trim() ||
    fallback
  );
}


function bindSafeEvent(
  id,
  eventType,
  handler
) {
  const element =
    document.getElementById(id);

  if (element) {
    element.addEventListener(
      eventType,
      handler
    );
  }
}


function safelySetTextContent(
  id,
  text
) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      text;
  }
}


function safelySetInputValue(
  id,
  value
) {
  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value;
  }
}


function storeFocus() {
  lastFocusedElement =
    document.activeElement;
}


function restoreFocus() {
  if (
    lastFocusedElement &&
    typeof lastFocusedElement.focus ===
      "function"
  ) {
    lastFocusedElement.focus();
  }

  lastFocusedElement = null;
}


// ==========================================
// 10. STATUS NORMALIZATION
// ==========================================
function normalizeStatus(status) {
  return (
    getSafeString(
      status,
      "active"
    ).toLowerCase() ===
    "disabled"
  )
    ? "Disabled"
    : "Active";
}


// ==========================================
// 11. GET USER BOOKINGS COUNT
// ==========================================
function getUserBookingsCount(
  user
) {
  if (!user) {
    return 0;
  }

  const userId =
    getSafeString(
      user._id
    );

  if (!userId) {
    return 0;
  }

  return bookingsStore.filter(
    (booking) => {

      const bookingUser =
        booking.user;

      if (!bookingUser) {
        return false;
      }

      const bookingUserId =
        typeof bookingUser ===
        "object"
          ? bookingUser._id
          : bookingUser;

      return (
        String(
          bookingUserId
        ) ===
        String(userId)
      );
    }
  ).length;
}


// ==========================================
// 12. FILTER EVENTS
// ==========================================
function bindFilterEvents() {
  bindSafeEvent(
    "searchUser",
    "input",
    renderTable
  );

  bindSafeEvent(
    "filterStatus",
    "change",
    renderTable
  );

  bindSafeEvent(
    "clearFiltersBtn",
    "click",
    () => {
      safelySetInputValue(
        "searchUser",
        ""
      );

      safelySetInputValue(
        "filterStatus",
        "All"
      );

      renderTable();
    }
  );
}


// ==========================================
// 13. UPDATE DASHBOARD
// ==========================================
function updateDashboard() {
  renderStats();
  renderTable();
}


// ==========================================
// 14. RENDER USER STATISTICS
// ==========================================
function renderStats() {
  const grid =
    document.getElementById(
      "userStatsGrid"
    );

  if (!grid) return;

  const total =
    usersStore.length;

  const active =
    usersStore.filter(
      (user) =>
        normalizeStatus(
          user.status
        ) === "Active"
    ).length;

  const disabled =
    usersStore.filter(
      (user) =>
        normalizeStatus(
          user.status
        ) === "Disabled"
    ).length;

  const sevenDaysAgo =
    Date.now() -
    7 *
      24 *
      60 *
      60 *
      1000;

  const newUsers =
    usersStore.filter(
      (user) => {
        if (!user.createdAt) {
          return false;
        }

        const date =
          new Date(
            user.createdAt
          );

        return (
          !Number.isNaN(
            date.getTime()
          ) &&
          date.getTime() >
            sevenDaysAgo
        );
      }
    ).length;

  grid.innerHTML = "";

  const stats = [
    {
      label:
        "Total Users",

      value:
        total,

      textClass:
        "stat-number",

      color:
        ""
    },

    {
      label:
        "Active Users",

      value:
        active,

      textClass:
        "stat-number text-primary",

      color:
        "#059669"
    },

    {
      label:
        "Disabled Users",

      value:
        disabled,

      textClass:
        "stat-number",

      color:
        "#dc2626"
    },

    {
      label:
        "New Users (7d)",

      value:
        newUsers,

      textClass:
        "stat-number",

      color:
        "#0284c7"
    }
  ];

  stats.forEach(
    (stat) => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "admin-stat-card";

      const content =
        document.createElement(
          "div"
        );

      content.className =
        "stat-content";

      const title =
        document.createElement(
          "h4"
        );

      title.textContent =
        stat.label;

      const value =
        document.createElement(
          "span"
        );

      value.className =
        stat.textClass;

      if (stat.color) {
        value.style.color =
          stat.color;
      }

      value.textContent =
        stat.value;

      content.appendChild(
        title
      );

      content.appendChild(
        value
      );

      card.appendChild(
        content
      );

      grid.appendChild(
        card
      );
    }
  );
}


// ==========================================
// 15. RENDER USERS TABLE
// ==========================================
function renderTable() {
  const tbody =
    document.getElementById(
      "usersTableBody"
    );

  const emptyState =
    document.getElementById(
      "emptyTableState"
    );

  const countElement =
    document.getElementById(
      "userCount"
    );

  if (!tbody) return;

  const searchInput =
    document.getElementById(
      "searchUser"
    );

  const statusSelect =
    document.getElementById(
      "filterStatus"
    );

  const query =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";

  const selectedStatus =
    statusSelect
      ? statusSelect.value
      : "All";


  // --------------------------------------
  // Filter
  // --------------------------------------
  const filtered =
    usersStore.filter(
      (user) => {

        const status =
          normalizeStatus(
            user.status
          );

        const name =
          getSafeString(
            user.name
          ).toLowerCase();

        const email =
          getSafeString(
            user.email
          ).toLowerCase();

        const matchesSearch =
          name.includes(
            query
          ) ||
          email.includes(
            query
          );

        const matchesStatus =
          selectedStatus ===
            "All" ||
          status ===
            selectedStatus;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );


  // --------------------------------------
  // Sort newest first
  // --------------------------------------
  filtered.sort(
    (a, b) => {
      const dateA =
        new Date(
          getSafeString(
            a.createdAt
          )
        ).getTime() || 0;

      const dateB =
        new Date(
          getSafeString(
            b.createdAt
          )
        ).getTime() || 0;

      return (
        dateB - dateA
      );
    }
  );


  if (countElement) {
    countElement.textContent =
      `${filtered.length} Users Registered`;
  }


  // --------------------------------------
  // Empty state
  // --------------------------------------
  if (
    filtered.length ===
    0
  ) {
    tbody.innerHTML =
      "";

    if (emptyState) {
      emptyState.style.display =
        "block";
    }

    return;
  }

  if (emptyState) {
    emptyState.style.display =
      "none";
  }

  tbody.innerHTML =
    "";


  // --------------------------------------
  // Action icons
  // --------------------------------------
  const SVG_VIEW =
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

  const SVG_EDIT =
    `<svg width="14" height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14
      a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7">
      </path>
      <path d="M18.5 2.5a2.121 2.121
      0 0 1 3 3L12 15l-4 1 1-4
      9.5-9.5z">
      </path>
    </svg>`;

  const SVG_TOGGLE =
    `<svg width="14" height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2">
      <path d="M18.36 6.64a9 9
      0 1 1-12.73 0">
      </path>
      <line x1="12" y1="2"
      x2="12" y2="12">
      </line>
    </svg>`;

  const SVG_DELETE =
    `<svg width="14" height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2">
      <polyline points="3 6 5 6 21 6">
      </polyline>
      <path d="M19 6v14a2 2
      0 0 1-2 2H7a2 2 0
      0 1-2-2V6m3 0V4a2
      2 0 0 1 2-2h4a2
      2 0 0 1 2 2v2">
      </path>
    </svg>`;


  // --------------------------------------
  // Create rows
  // --------------------------------------
  filtered.forEach(
    (user) => {

      const tr =
        document.createElement(
          "tr"
        );

      const status =
        normalizeStatus(
          user.status
        );

      const statusClass =
        status === "Active"
          ? "status-active"
          : "status-disabled";

      const safeName =
        getSafeString(
          user.name,
          "User"
        );

      const safeEmail =
        getSafeString(
          user.email
        );

      const initial =
        safeName
          .charAt(0)
          .toUpperCase();

      let joinedDate =
        "—";

      if (
        user.createdAt
      ) {
        const date =
          new Date(
            user.createdAt
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          joinedDate =
            date.toLocaleDateString(
              "en-IN",
              {
                day:
                  "numeric",

                month:
                  "short",

                year:
                  "numeric"
              }
            );
        }
      }

      const bookingsCount =
        getUserBookingsCount(
          user
        );

      const nextStatus =
        status ===
        "Active"
          ? "Disabled"
          : "Active";

      const toggleTitle =
        status ===
        "Active"
          ? "Disable Account"
          : "Enable Account";


      // ----------------------------------
      // User profile
      // ----------------------------------
      const tdProfile =
        document.createElement(
          "td"
        );

      const cellWrap =
        document.createElement(
          "div"
        );

      cellWrap.className =
        "user-cell-wrap";

      const avatar =
        document.createElement(
          "div"
        );

      avatar.className =
        "user-avatar-mini";

      avatar.textContent =
        initial;

      const infoWrap =
        document.createElement(
          "div"
        );

      const nameDiv =
        document.createElement(
          "div"
        );

      nameDiv.className =
        "user-name";

      nameDiv.textContent =
        safeName;

      const emailDiv =
        document.createElement(
          "div"
        );

      emailDiv.className =
        "user-email";

      emailDiv.textContent =
        safeEmail;

      infoWrap.appendChild(
        nameDiv
      );

      infoWrap.appendChild(
        emailDiv
      );

      cellWrap.appendChild(
        avatar
      );

      cellWrap.appendChild(
        infoWrap
      );

      tdProfile.appendChild(
        cellWrap
      );

      tr.appendChild(
        tdProfile
      );


      // ----------------------------------
      // Contact
      // ----------------------------------
      const tdContact =
        document.createElement(
          "td"
        );

      const mobileSpan =
        document.createElement(
          "span"
        );

      mobileSpan.className =
        "user-mobile";

      mobileSpan.textContent =
        getSafeString(
          user.mobile,
          "Not provided"
        );

      tdContact.appendChild(
        mobileSpan
      );

      tr.appendChild(
        tdContact
      );


      // ----------------------------------
      // Registration date
      // ----------------------------------
      const tdDate =
        document.createElement(
          "td"
        );

      const dateSpan =
        document.createElement(
          "span"
        );

      dateSpan.className =
        "date-val";

      dateSpan.textContent =
        joinedDate;

      tdDate.appendChild(
        dateSpan
      );

      tr.appendChild(
        tdDate
      );


      // ----------------------------------
      // Bookings
      // ----------------------------------
      const tdBookings =
        document.createElement(
          "td"
        );

      const bookingSpan =
        document.createElement(
          "span"
        );

      bookingSpan.className =
        "font-bold text-primary";

      bookingSpan.textContent =
        `${bookingsCount} Bookings`;

      tdBookings.appendChild(
        bookingSpan
      );

      tr.appendChild(
        tdBookings
      );


      // ----------------------------------
      // Status
      // ----------------------------------
      const tdStatus =
        document.createElement(
          "td"
        );

      const statusSpan =
        document.createElement(
          "span"
        );

      statusSpan.className =
        `status-badge ${statusClass}`;

      statusSpan.textContent =
        status;

      tdStatus.appendChild(
        statusSpan
      );

      tr.appendChild(
        tdStatus
      );


      // ----------------------------------
      // Actions
      // ----------------------------------
      const tdActions =
        document.createElement(
          "td"
        );

      tdActions.className =
        "text-right";

      const actionGroup =
        document.createElement(
          "div"
        );

      actionGroup.className =
        "action-btn-group";


      // View
      const btnView =
        document.createElement(
          "button"
        );

      btnView.type =
        "button";

      btnView.className =
        "btn-action-small";

      btnView.title =
        "View Profile";

      btnView.setAttribute(
        "aria-label",
        "View Profile"
      );

      btnView.innerHTML =
        SVG_VIEW;

      btnView.addEventListener(
        "click",
        () =>
          openDetailsModal(
            user._id
          )
      );


      // Edit
      const btnEdit =
        document.createElement(
          "button"
        );

      btnEdit.type =
        "button";

      btnEdit.className =
        "btn-action-small primary";

      btnEdit.title =
        "Edit User";

      btnEdit.setAttribute(
        "aria-label",
        "Edit User"
      );

      btnEdit.innerHTML =
        SVG_EDIT;

      btnEdit.addEventListener(
        "click",
        () =>
          openEditModal(
            user._id
          )
      );


      // Toggle
      const btnToggle =
        document.createElement(
          "button"
        );

      btnToggle.type =
        "button";

      btnToggle.className =
        "btn-action-small warning";

      btnToggle.title =
        toggleTitle;

      btnToggle.setAttribute(
        "aria-label",
        toggleTitle
      );

      btnToggle.innerHTML =
        SVG_TOGGLE;

      btnToggle.addEventListener(
        "click",
        () =>
          toggleUserStatus(
            user._id,
            nextStatus
          )
      );


      // Delete
      const btnDelete =
        document.createElement(
          "button"
        );

      btnDelete.type =
        "button";

      btnDelete.className =
        "btn-action-small danger";

      btnDelete.title =
        "Delete User";

      btnDelete.setAttribute(
        "aria-label",
        "Delete User"
      );

      btnDelete.innerHTML =
        SVG_DELETE;

      btnDelete.addEventListener(
        "click",
        () =>
          confirmDeleteUser(
            user._id
          )
      );


      actionGroup.appendChild(
        btnView
      );

      actionGroup.appendChild(
        btnEdit
      );

      actionGroup.appendChild(
        btnToggle
      );

      actionGroup.appendChild(
        btnDelete
      );

      tdActions.appendChild(
        actionGroup
      );

      tr.appendChild(
        tdActions
      );

      tbody.appendChild(
        tr
      );
    }
  );
}


// ==========================================
// 16. VIEW USER
// ==========================================
function openDetailsModal(
  userId
) {
  if (!userId) return;

  const user =
    usersStore.find(
      (item) =>
        String(
          item._id
        ) ===
        String(
          userId
        )
    );

  if (!user) return;

  const status =
    normalizeStatus(
      user.status
    );

  const badge =
    document.getElementById(
      "modalUserStatusBadge"
    );

  if (badge) {
    badge.textContent =
      status;

    badge.className =
      `status-badge status-${status.toLowerCase()}`;
  }

  const safeName =
    getSafeString(
      user.name,
      "User"
    );

  safelySetTextContent(
    "modalUserAvatar",
    safeName
      .charAt(0)
      .toUpperCase()
  );

  safelySetTextContent(
    "modalUserName",
    safeName
  );

  safelySetTextContent(
    "modalUserEmail",
    getSafeString(
      user.email
    )
  );

  safelySetTextContent(
    "modalUserMobile",
    getSafeString(
      user.mobile,
      "Not provided"
    )
  );

  safelySetTextContent(
    "modalUserBookingsCount",
    getUserBookingsCount(
      user
    )
  );

  let joined =
    "—";

  if (
    user.createdAt
  ) {
    const date =
      new Date(
        user.createdAt
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      joined =
        date.toLocaleDateString(
          "en-IN",
          {
            day:
              "numeric",

            month:
              "long",

            year:
              "numeric"
          }
        );
    }
  }

  safelySetTextContent(
    "modalUserJoined",
    joined
  );

  storeFocus();

  const overlay =
    document.getElementById(
      "detailsModalOverlay"
    );

  if (overlay) {
    overlay.classList.add(
      "visible"
    );
  }
}


// ==========================================
// 17. EDIT USER
// ==========================================
function openEditModal(
  userId
) {
  if (!userId) return;

  const user =
    usersStore.find(
      (item) =>
        String(
          item._id
        ) ===
        String(
          userId
        )
    );

  if (!user) return;

  safelySetInputValue(
    "editUserEmailKey",
    getSafeString(
      user._id
    )
  );

  safelySetInputValue(
    "editUserName",
    getSafeString(
      user.name
    )
  );

  safelySetInputValue(
    "editUserMobile",
    getSafeString(
      user.mobile
    )
  );

  storeFocus();

  const overlay =
    document.getElementById(
      "editModalOverlay"
    );

  if (overlay) {
    overlay.classList.add(
      "visible"
    );
  }
}


// ==========================================
// 18. UPDATE USER
// ==========================================
async function updateUser(
  userId,
  name,
  mobile
) {
  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  if (!token) {
    window.location.href =
      "../login.html";

    return false;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/users/admin/${userId}`,
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              name,
              mobile
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
        "Unable to update user."
      );

      return false;
    }

    await refreshUsersData();

    return true;

  } catch (error) {
    console.error(
      "Update user error:",
      error
    );

    alert(
      "Unable to update user. Please try again."
    );

    return false;
  }
}


// ==========================================
// 19. TOGGLE USER STATUS
// ==========================================
async function toggleUserStatus(
  userId,
  newStatus
) {
  if (
    newStatus !==
      "Active" &&
    newStatus !==
      "Disabled"
  ) {
    return;
  }

  const token =
    sessionStorage.getItem(
      "pg_token"
    );

  if (!token) {
    window.location.href =
      "../login.html";

    return;
  }

  const backendStatus =
    newStatus ===
    "Active"
      ? "active"
      : "disabled";

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/users/admin/${userId}/status`,
        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              status:
                backendStatus
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
        "Unable to update user status."
      );

      return;
    }

    await refreshUsersData();

  } catch (error) {
    console.error(
      "Toggle user status error:",
      error
    );

    alert(
      "Unable to update user status. Please try again."
    );
  }
}


// ==========================================
// 20. DELETE USER CONFIRMATION
// ==========================================
function confirmDeleteUser(
  userId
) {
  if (!userId) return;

  const user =
    usersStore.find(
      (item) =>
        String(
          item._id
        ) ===
        String(
          userId
        )
    );

  if (!user) return;

  deleteTargetId =
    user._id;

  safelySetTextContent(
    "deleteUserTargetName",
    getSafeString(
      user.name
    )
  );

  storeFocus();

  const overlay =
    document.getElementById(
      "deleteModalOverlay"
    );

  if (overlay) {
    overlay.classList.add(
      "visible"
    );
  }
}


// ==========================================
// 21. DELETE USER
// ==========================================
async function deleteUser(
  userId
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
        `${API_BASE_URL}/users/admin/${userId}`,
        {
          method:
            "DELETE",

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
        "Unable to delete user."
      );

      return;
    }

    deleteTargetId =
      null;

    await refreshUsersData();

  } catch (error) {
    console.error(
      "Delete user error:",
      error
    );

    alert(
      "Unable to delete user. Please try again."
    );
  }
}


// ==========================================
// 22. MODAL EVENTS
// ==========================================
function bindModalEvents() {

  // --------------------------------------
  // Close Details
  // --------------------------------------
  const closeDetails =
    () => {
      const overlay =
        document.getElementById(
          "detailsModalOverlay"
        );

      if (overlay) {
        overlay.classList.remove(
          "visible"
        );
      }

      restoreFocus();
    };


  // --------------------------------------
  // Close Edit
  // --------------------------------------
  const closeEdit =
    () => {
      const overlay =
        document.getElementById(
          "editModalOverlay"
        );

      if (overlay) {
        overlay.classList.remove(
          "visible"
        );
      }

      restoreFocus();
    };


  // --------------------------------------
  // Close Delete
  // --------------------------------------
  const closeDelete =
    () => {
      deleteTargetId =
        null;

      const overlay =
        document.getElementById(
          "deleteModalOverlay"
        );

      if (overlay) {
        overlay.classList.remove(
          "visible"
        );
      }

      restoreFocus();
    };


  bindSafeEvent(
    "closeDetailsModal",
    "click",
    closeDetails
  );

  bindSafeEvent(
    "closeEditModal",
    "click",
    closeEdit
  );

  bindSafeEvent(
    "cancelEditBtn",
    "click",
    closeEdit
  );

  bindSafeEvent(
    "cancelDeleteBtn",
    "click",
    closeDelete
  );


  // --------------------------------------
  // Edit User Form
  // --------------------------------------
  bindSafeEvent(
    "editUserForm",
    "submit",
    async (event) => {
      event.preventDefault();

      const idElement =
        document.getElementById(
          "editUserEmailKey"
        );

      const nameElement =
        document.getElementById(
          "editUserName"
        );

      const mobileElement =
        document.getElementById(
          "editUserMobile"
        );

      if (
        !idElement ||
        !nameElement ||
        !mobileElement
      ) {
        return;
      }

      const userId =
        getSafeString(
          idElement.value
        );

      const name =
        getSafeString(
          nameElement.value
        );

      const mobile =
        getSafeString(
          mobileElement.value
        );


      // ----------------------------------
      // Validate name
      // ----------------------------------
      if (!name) {
        alert(
          "Full Name is required."
        );

        return;
      }


      // ----------------------------------
      // Validate mobile
      // ----------------------------------
      if (mobile) {
        const mobileRegex =
          /^[6-9]\d{9}$/;

        if (
          !mobileRegex.test(
            mobile
          )
        ) {
          alert(
            "Please enter a valid 10-digit Indian mobile number."
          );

          return;
        }
      }


      // ----------------------------------
      // Update backend
      // ----------------------------------
      const success =
        await updateUser(
          userId,
          name,
          mobile
        );

      if (success) {
        closeEdit();
      }
    }
  );


  // --------------------------------------
  // Confirm Delete
  // --------------------------------------
  bindSafeEvent(
    "confirmDeleteBtn",
    "click",
    async () => {

      if (!deleteTargetId) {
        return;
      }

      const targetId =
        deleteTargetId;

      const token =
        sessionStorage.getItem(
          "pg_token"
        );

      if (!token) {
        window.location.href =
          "../login.html";

        return;
      }

      await deleteUser(
        targetId
      );

      closeDelete();
    }
  );


  // --------------------------------------
  // Click outside modal
  // --------------------------------------
  [
    "detailsModalOverlay",
    "editModalOverlay",
    "deleteModalOverlay"
  ].forEach(
    (id) => {

      const overlay =
        document.getElementById(
          id
        );

      if (!overlay) {
        return;
      }

      overlay.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            overlay
          ) {

            if (
              id ===
              "detailsModalOverlay"
            ) {
              closeDetails();
            }

            if (
              id ===
              "editModalOverlay"
            ) {
              closeEdit();
            }

            if (
              id ===
              "deleteModalOverlay"
            ) {
              closeDelete();
            }
          }
        }
      );
    }
  );


  // --------------------------------------
  // Escape key
  // --------------------------------------
  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      const details =
        document.getElementById(
          "detailsModalOverlay"
        );

      const edit =
        document.getElementById(
          "editModalOverlay"
        );

      const deleteModal =
        document.getElementById(
          "deleteModalOverlay"
        );

      if (
        details &&
        details.classList.contains(
          "visible"
        )
      ) {
        closeDetails();
      }

      if (
        edit &&
        edit.classList.contains(
          "visible"
        )
      ) {
        closeEdit();
      }

      if (
        deleteModal &&
        deleteModal.classList.contains(
          "visible"
        )
      ) {
        closeDelete();
      }
    }
  );
}



