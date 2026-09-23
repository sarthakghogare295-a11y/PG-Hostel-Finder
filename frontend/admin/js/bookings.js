/**
 * PG/Hostel Finder Admin Bookings Module
 * Manages Bookings filtering, statistics, and status updates.
 */

/*
 * FUTURE BACKEND INTEGRATION NOTE:
 * Currently, this module uses sessionStorage as a temporary prototype storage.
 * In the future, this will be replaced by authenticated Node.js/Express API calls 
 * backed by a MongoDB database. 
 * Real status transitions and data retrieval will be handled via secure endpoints.
 */

const API_BASE_URL = "http://localhost:5000/api";

let bookingsData = [];

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const user = checkAdminAuth();
  if (!user) return;

  initSidebar();
  initLogout();
  setupAdminProfile(user);
  
  loadBookingsData();
  populatePropertyFilter();
  bindFilterEvents();
  bindModalEvents();
  
  updateDashboard();
});

// ==========================================
// 2. AUTHENTICATION & PROFILE
// ==========================================
function checkAdminAuth() {
  const content = document.getElementById("adminContent");
  let user = null;
  try {
    const raw = sessionStorage.getItem("pg_current_user");
    if (!raw) { window.location.href = "../../html/login.html"; return null; }
    user = JSON.parse(raw);
    if (!user || user.role !== "admin") { window.location.href = "../../html/login.html"; return null; }
  } catch (err) {
    window.location.href = "../../html/login.html";
    return null;
  }
  if (content) content.style.display = "block";
  return user;
}

function setupAdminProfile(user) {
  const avatar = document.getElementById("topbarAvatar");
  const nameStr = document.getElementById("topbarName");
  if (avatar && user.name) avatar.textContent = String(user.name).charAt(0).toUpperCase();
  if (nameStr && user.name) nameStr.textContent = getSafeString(user.name);
}

function initLogout() {
  bindSafeEvent("adminLogoutBtn", "click", () => {
    try { sessionStorage.removeItem("pg_current_user"); } catch (e) {}
    window.location.href = "../../html/login.html";
  });
}

// ==========================================
// 3. LAYOUT / SIDEBAR NAVIGATION
// ==========================================
function initSidebar() {
  const sidebar = document.getElementById("adminSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");

  const openSidebar = () => {
    if (sidebar) sidebar.classList.add("is-open");
    if (backdrop) backdrop.classList.add("is-open");
  };

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
  };

  bindSafeEvent("adminMenuBtn", "click", openSidebar);
  bindSafeEvent("sidebarCloseBtn", "click", closeSidebar);
  bindSafeEvent("sidebarBackdrop", "click", closeSidebar);
}

// ==========================================
// 4. DATA MANAGEMENT (Prototype sessionStorage)
// ==========================================
async function loadBookingsData() {
  const token = sessionStorage.getItem("pg_token");

  if (!token) {
    window.location.href = "../../html/login.html";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/bookings/admin/all`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to load bookings"
      );
    }

    bookingsData = (data.bookings || []).map((booking) => ({
      bookingId: booking.bookingId,

      guestName: booking.user?.name || "--",
      guestEmail: booking.user?.email || "--",
      guestPhone: booking.user?.mobile || "--",

      propertyName: booking.property?.name || "--",

      location:
        booking.property?.location?.city &&
        booking.property?.location?.state
          ? `${booking.property.location.city}, ${booking.property.location.state}`
          : booking.property?.location?.address || "Pune",

      roomNumber: booking.room?.roomNumber || "--",
      roomType: booking.room?.roomType || "--",

      moveInDate: booking.checkIn,
      moveOutDate: booking.checkOut,

      occupants: booking.occupants,

      monthlyRent: booking.monthlyRent,
      securityDeposit: booking.deposit,
      totalAmount: booking.totalAmount,

      specialRequests: booking.specialRequests || "",

      status: booking.status,
      createdAt: booking.createdAt,

      mongoId: booking._id
    }));

    populatePropertyFilter();
    updateDashboard();

  } catch (error) {
    console.error(
      "Failed to load bookings:",
      error
    );

    bookingsData = [];

    alert(
      "Unable to load bookings from the backend.\n\n" +
      "Make sure the backend server is running."
    );
  }
}

function saveBookingsData() {
  try {
    if (bookingsData.length === 1) {
      sessionStorage.setItem("pg_booking_data", JSON.stringify(bookingsData[0]));
    } else {
      sessionStorage.setItem("pg_booking_data", JSON.stringify(bookingsData));
    }
  } catch(e) {
    console.error("Failed to save bookings state:", e);
  }
}

// ==========================================
// 5. SAFETY & FORMATTING UTILITIES
// ==========================================
function getSafeString(val, fallback = "--") {
  if (val === null || val === undefined || String(val).trim() === "") return fallback;
  return String(val).trim();
}

function getSafeNumber(val, fallback = 0) {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

function formatSafeCurrency(val) {
  const num = getSafeNumber(val, 0);
  return num.toLocaleString('en-IN');
}

function formatSafeDate(dateString, includeTime = false) {
  if (!dateString) return "--";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return "--";
  
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return dateObj.toLocaleDateString("en-IN", options);
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function bindSafeEvent(id, eventType, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(eventType, handler);
  }
}

function safelySetTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ==========================================
// 6. UI RENDERING & FILTERING
// ==========================================
function updateDashboard() {
  renderStats();
  renderTable();
}

function populatePropertyFilter() {
  const propSelect = document.getElementById("filterProperty");
  if (!propSelect) return;
  
  const currentVal = propSelect.value;
  propSelect.innerHTML = "";
  
  const defaultOption = document.createElement("option");
  defaultOption.value = "All";
  defaultOption.textContent = "All Properties";
  propSelect.appendChild(defaultOption);

  const uniqueProps = [...new Set(bookingsData.map(b => getSafeString(b.propertyName, "Unknown")))]
    .filter(p => p !== "Unknown")
    .sort();
    
  uniqueProps.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    propSelect.appendChild(option);
  });
  
  propSelect.value = currentVal || "All";
}

function bindFilterEvents() {
  bindSafeEvent("searchBooking", "input", renderTable);
  bindSafeEvent("filterStatus", "change", renderTable);
  bindSafeEvent("filterProperty", "change", renderTable);

  bindSafeEvent("clearFiltersBtn", "click", () => {
    const searchInput = document.getElementById("searchBooking");
    const statusSelect = document.getElementById("filterStatus");
    const propSelect = document.getElementById("filterProperty");
    
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "All";
    if (propSelect) propSelect.value = "All";
    
    renderTable();
  });
}

function renderStats() {
  const total = bookingsData.length;
  const requested = bookingsData.filter(b => getSafeString(b.status, "Requested") === "Requested").length;
  const confirmed = bookingsData.filter(b => getSafeString(b.status) === "Confirmed").length;
  const completed = bookingsData.filter(b => getSafeString(b.status) === "Completed").length;
  const cancelled = bookingsData.filter(b => getSafeString(b.status) === "Cancelled").length;

  const grid = document.getElementById("bookingStatsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const stats = [
    { label: "Total Bookings", value: total, textClass: "" },
    { label: "Requested", value: requested, textClass: "text-amber" },
    { label: "Confirmed", value: confirmed, textClass: "text-green" },
    { label: "Completed", value: completed, textClass: "text-blue" },
    { label: "Cancelled", value: cancelled, textClass: "text-red" }
  ];

  stats.forEach(stat => {
    const card = document.createElement("div");
    card.className = "admin-stat-card";
    
    const content = document.createElement("div");
    content.className = "stat-content";
    
    const title = document.createElement("h4");
    title.textContent = stat.label;
    
    const valueSpan = document.createElement("span");
    valueSpan.className = `stat-number ${stat.textClass}`;
    valueSpan.textContent = getSafeNumber(stat.value, 0);
    
    content.appendChild(title);
    content.appendChild(valueSpan);
    card.appendChild(content);
    grid.appendChild(card);
  });
}

function renderTable() {
  const tbody = document.getElementById("bookingsTableBody");
  const emptyState = document.getElementById("emptyTableState");
  const countEl = document.getElementById("bookingCount");
  
  if (!tbody) return;

  const searchInput = document.getElementById("searchBooking");
  const statusSelect = document.getElementById("filterStatus");
  const propSelect = document.getElementById("filterProperty");

  const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const statF = statusSelect ? statusSelect.value : "All";
  const propF = propSelect ? propSelect.value : "All";

  const filtered = bookingsData.filter(b => {
    const status = getSafeString(b.status, "Requested");
    const safeId = getSafeString(b.bookingId).toLowerCase();
    const safeName = getSafeString(b.guestName).toLowerCase();
    const safeEmail = getSafeString(b.guestEmail).toLowerCase();
    const safePropName = getSafeString(b.propertyName);
    
    const matchQ = safeId.includes(q) || safeName.includes(q) || safeEmail.includes(q);
    const matchStat = statF === "All" || status === statF;
    const matchProp = propF === "All" || safePropName === propF;
    
    return matchQ && matchStat && matchProp;
  });

  filtered.sort((a, b) => {
    const dateA = new Date(getSafeString(a.createdAt, 0)).getTime();
    const dateB = new Date(getSafeString(b.createdAt, 0)).getTime();
    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
  });

  if (countEl) countEl.textContent = `${filtered.length} Bookings Found`;

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  tbody.innerHTML = "";

  const SVG_VIEW = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const SVG_CONFIRM = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const SVG_CANCEL = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const SVG_COMPLETE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

  filtered.forEach(b => {
    const status = getSafeString(b.status, "Requested");
    const statusClass = `status-${status.toLowerCase()}`;
    const safeId = getSafeString(b.bookingId);
    
    const tr = document.createElement("tr");

    // Booking ID
    const tdId = document.createElement("td");
    tdId.className = "booking-id";
    tdId.textContent = safeId;
    tr.appendChild(tdId);

    // Guest Info
    const tdGuest = document.createElement("td");
    const spanGuestName = document.createElement("span");
    spanGuestName.className = "guest-name";
    spanGuestName.textContent = getSafeString(b.guestName);
    const spanGuestEmail = document.createElement("span");
    spanGuestEmail.className = "guest-email";
    spanGuestEmail.textContent = getSafeString(b.guestEmail);
    tdGuest.appendChild(spanGuestName);
    tdGuest.appendChild(spanGuestEmail);
    tr.appendChild(tdGuest);

    // Property Info
    const tdProp = document.createElement("td");
    const spanPropName = document.createElement("span");
    spanPropName.className = "prop-name";
    spanPropName.textContent = getSafeString(b.propertyName);
    const spanRoomType = document.createElement("span");
    spanRoomType.className = "room-type";
    spanRoomType.textContent = `${getSafeString(b.roomType)} Sharing`;
    tdProp.appendChild(spanPropName);
    tdProp.appendChild(spanRoomType);
    tr.appendChild(tdProp);

    // Dates
    const tdDates = document.createElement("td");
    const spanMoveIn = document.createElement("span");
    spanMoveIn.className = "date-val";
    spanMoveIn.textContent = formatSafeDate(b.moveInDate);
    const spanCreated = document.createElement("span");
    spanCreated.className = "room-type";
    spanCreated.textContent = `Booked: ${formatSafeDate(b.createdAt)}`;
    tdDates.appendChild(spanMoveIn);
    tdDates.appendChild(spanCreated);
    tr.appendChild(tdDates);

    // Amount
    const tdAmount = document.createElement("td");
    tdAmount.className = "font-bold text-primary";
    tdAmount.textContent = `₹${formatSafeCurrency(b.totalAmount)}`;
    tr.appendChild(tdAmount);

    // Status
    const tdStatus = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.textContent = status;
    tdStatus.appendChild(statusBadge);
    tr.appendChild(tdStatus);

    // Actions
    const tdActions = document.createElement("td");
    tdActions.className = "text-right";
    const btnGroup = document.createElement("div");
    btnGroup.className = "action-btn-group";

    // View Detail Action
    const btnView = document.createElement("button");
    btnView.className = "btn-action-small";
    btnView.title = "View Details";
    btnView.dataset.bookingId = safeId;
    btnView.innerHTML = SVG_VIEW;
    btnView.addEventListener("click", () => openDetailsModal(safeId));
    btnGroup.appendChild(btnView);

    // Condition Actions based on status logic
    if (status === "Requested") {
      const btnConfirm = document.createElement("button");
      btnConfirm.className = "btn-action-small success";
      btnConfirm.title = "Confirm Booking";
      btnConfirm.dataset.bookingId = safeId;
      btnConfirm.innerHTML = SVG_CONFIRM;
      btnConfirm.addEventListener("click", () => updateStatus(safeId, "Confirmed"));
      btnGroup.appendChild(btnConfirm);

      const btnCancel = document.createElement("button");
      btnCancel.className = "btn-action-small danger";
      btnCancel.title = "Cancel Booking";
      btnCancel.dataset.bookingId = safeId;
      btnCancel.innerHTML = SVG_CANCEL;
      btnCancel.addEventListener("click", () => updateStatus(safeId, "Cancelled"));
      btnGroup.appendChild(btnCancel);
    } else if (status === "Confirmed") {
      const btnComplete = document.createElement("button");
      btnComplete.className = "btn-action-small primary";
      btnComplete.title = "Mark Completed";
      btnComplete.dataset.bookingId = safeId;
      btnComplete.innerHTML = SVG_COMPLETE;
      btnComplete.addEventListener("click", () => updateStatus(safeId, "Completed"));
      btnGroup.appendChild(btnComplete);

      const btnCancel = document.createElement("button");
      btnCancel.className = "btn-action-small danger";
      btnCancel.title = "Cancel Booking";
      btnCancel.dataset.bookingId = safeId;
      btnCancel.innerHTML = SVG_CANCEL;
      btnCancel.addEventListener("click", () => updateStatus(safeId, "Cancelled"));
      btnGroup.appendChild(btnCancel);
    }

    tdActions.appendChild(btnGroup);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

// ==========================================
// 7. ACTIONS & MODALS
// ==========================================

// Kept globally accessible as requested
window.updateStatus = async function(bookingId, newStatus) {
  if (!bookingId || !newStatus) return;

  const booking = bookingsData.find(
    (b) => getSafeString(b.bookingId) === bookingId
  );

  if (!booking || !booking.mongoId) {
    alert("Booking not found.");
    return;
  }

  const token = sessionStorage.getItem("pg_token");

  if (!token) {
    window.location.href = "../../html/login.html";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/bookings/admin/${booking.mongoId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(
        data.message ||
        "Unable to update booking status."
      );
      return;
    }

    await loadBookingsData();

  } catch (error) {
    console.error(
      "Booking status update error:",
      error
    );

    alert(
      "Unable to update booking. Please try again."
    );
  }
};

// Kept globally accessible as requested
window.openDetailsModal = function(bookingId) {
  if (!bookingId) return;

  const b = bookingsData.find(x => getSafeString(x.bookingId) === bookingId);
  if (!b) return;

  const status = getSafeString(b.status, "Requested");
  
  const badge = document.getElementById("modalStatusBadge");
  if (badge) {
    badge.textContent = status;
    badge.className = `status-badge status-${status.toLowerCase()}`;
  }
  
  safelySetTextContent("modalBookingId", `ID: ${getSafeString(b.bookingId)}`);
  safelySetTextContent("modalGuestName", getSafeString(b.guestName));
  safelySetTextContent("modalGuestEmail", getSafeString(b.guestEmail));
  safelySetTextContent("modalGuestPhone", getSafeString(b.guestPhone));
  safelySetTextContent("modalOccupants", `${getSafeNumber(b.occupants, 1)} Person(s)`);

  safelySetTextContent("modalPropertyName", getSafeString(b.propertyName));
  safelySetTextContent("modalLocation", getSafeString(b.location, "Pune"));
  safelySetTextContent("modalRoomType", `${getSafeString(b.roomType)} Sharing`);
  safelySetTextContent("modalMoveInDate", formatSafeDate(b.moveInDate));

  safelySetTextContent("modalRent", formatSafeCurrency(b.monthlyRent));
  safelySetTextContent("modalDeposit", formatSafeCurrency(b.securityDeposit));
  safelySetTextContent("modalTotal", formatSafeCurrency(b.totalAmount));

  const reqWrapper = document.getElementById("specialRequestsWrapper");
  const requestsText = getSafeString(b.specialRequests, "");
  
  if (reqWrapper) {
    if (requestsText.length > 0 && requestsText !== "--") {
      safelySetTextContent("modalSpecialRequests", requestsText);
      reqWrapper.style.display = "block";
    } else {
      reqWrapper.style.display = "none";
    }
  }

  safelySetTextContent("modalCreatedAt", formatSafeDate(b.createdAt, true));

  const overlay = document.getElementById("detailsModalOverlay");
  if (overlay) overlay.classList.add("visible");
};

function bindModalEvents() {
  const overlay = document.getElementById("detailsModalOverlay");
  
  const closeDetails = () => {
    if (overlay) overlay.classList.remove("visible");
  };

  bindSafeEvent("closeDetailsModal", "click", closeDetails);
  
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target.id === "detailsModalOverlay") closeDetails();
    });
  }

  // Accessibility: Escape key support
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
      if (overlay && overlay.classList.contains("visible")) {
        closeDetails();
      }
    }
  });
}