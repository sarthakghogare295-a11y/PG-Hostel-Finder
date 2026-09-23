/**
 * PG/Hostel Finder Admin Properties Module
 * Backend-connected version
 *
 * Backend:
 * GET    /api/properties
 * POST   /api/properties
 * PUT    /api/properties/:id
 * DELETE /api/properties/:id
 *
 * Rooms:
 * GET    /api/rooms/property/:propertyId
 * POST   /api/rooms/property/:propertyId
 * DELETE /api/rooms/:id
 */

const API_BASE_URL = "https://pg-hostel-finder-yevr.onrender.com/api";

let propertiesStore = [];
let deleteTargetId = null;
let currentRoomsPropId = null;
let currentRoomsStore = [];

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

    await loadData();
    renderTable();
});

// ==========================================
// 2. AUTHENTICATION
// ==========================================

function checkAdminAuth() {
    const content = document.getElementById("adminContent");

    let user = null;

    try {
        const rawUser = sessionStorage.getItem("pg_current_user");
        const token = sessionStorage.getItem("pg_token");

        if (!rawUser || !token) {
            window.location.href = "../login.html";
            return null;
        }

        user = JSON.parse(rawUser);

        if (!user || user.role !== "admin") {
            window.location.href = "../login.html";
            return null;
        }
    } catch (error) {
        console.error("Admin authentication error:", error);
        window.location.href = "../login.html";
        return null;
    }

    if (content) {
        content.style.display = "block";
    }

    return user;
}

function getAuthHeaders() {
    const token = sessionStorage.getItem("pg_token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}

// ==========================================
// 3. ADMIN PROFILE
// ==========================================

function setupAdminProfile(user) {
    const avatar = document.getElementById("topbarAvatar");
    const nameElement = document.getElementById("topbarName");

    if (avatar && user.name) {
        avatar.textContent =
            String(user.name).charAt(0).toUpperCase();
    }

    if (nameElement && user.name) {
        nameElement.textContent =
            getSafeString(user.name);
    }
}

function initLogout() {
    bindSafeEvent("adminLogoutBtn", "click", () => {
        sessionStorage.removeItem("pg_current_user");
        sessionStorage.removeItem("pg_token");

        window.location.href = "../login.html";
    });
}

// ==========================================
// 4. SIDEBAR
// ==========================================

function initSidebar() {
    const sidebar =
        document.getElementById("adminSidebar");

    const backdrop =
        document.getElementById("sidebarBackdrop");

    const openSidebar = () => {
        if (sidebar) {
            sidebar.classList.add("is-open");
        }

        if (backdrop) {
            backdrop.classList.add("is-open");
        }
    };

    const closeSidebar = () => {
        if (sidebar) {
            sidebar.classList.remove("is-open");
        }

        if (backdrop) {
            backdrop.classList.remove("is-open");
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
// 5. LOAD PROPERTIES FROM BACKEND
// ==========================================

async function loadData() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/properties`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load properties."
            );
        }

        const properties =
            Array.isArray(data.properties)
                ? data.properties
                : [];

        const propertiesWithRooms =
            await Promise.all(
                properties.map(async (property) => {
                    const rooms =
                        await loadRoomsForProperty(
                            property._id
                        );

                    return normalizeProperty(
                        property,
                        rooms
                    );
                })
            );

        propertiesStore =
            propertiesWithRooms;

    } catch (error) {
        console.error(
            "Failed to load properties:",
            error
        );

        propertiesStore = [];

        alert(
            "Unable to load properties from the backend.\n\n" +
            "Make sure the backend server is running."
        );
    }
}

// ==========================================
// 6. LOAD ROOMS
// ==========================================

async function loadRoomsForProperty(propertyId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/rooms/property/${propertyId}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error(
                "Failed to load rooms:",
                data.message
            );

            return [];
        }

        return Array.isArray(data.rooms)
            ? data.rooms
            : [];

    } catch (error) {
        console.error(
            "Room loading error:",
            error
        );

        return [];
    }
}

// ==========================================
// 7. NORMALIZE PROPERTY
// ==========================================

function normalizeProperty(
    property,
    rooms = []
) {
    const location =
        property.location || {};

    const normalizedRooms =
        rooms.map((room) => ({
            id: room._id,
            roomType: room.roomType,
            rent: room.rent,
            capacity: room.capacity,
            availableBeds: room.availableBeds,
            status: room.status,

            available:
                room.status === "Available" &&
                Number(room.availableBeds) > 0
        }));

    return {
        id: property._id,

        name: property.name,

        propertyType:
            property.propertyType,

        location: [
            location.address,
            location.city,
            location.state
        ]
            .filter(Boolean)
            .join(", "),

        rent:
            property.rentFrom,

        deposit:
            property.deposit,

        image:
            Array.isArray(property.images) &&
                property.images.length > 0
                ? property.images[0]
                : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=700&q=80",

        rooms:
            normalizedRooms,

        // Keep complete MongoDB document.
        originalProperty:
            property
    };
}

// ==========================================
// 8. UTILITIES
// ==========================================

function getSafeString(
    value,
    fallback = "--"
) {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return fallback;
    }

    return String(value).trim();
}

function getSafeNumber(
    value,
    fallback = 0
) {
    const number = Number(value);

    return Number.isNaN(number)
        ? fallback
        : number;
}

function formatSafeCurrency(value) {
    return getSafeNumber(
        value,
        0
    ).toLocaleString("en-IN");
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

function safelySetInputValue(
    id,
    value
) {
    const element =
        document.getElementById(id);

    if (element) {
        element.value =
            value ?? "";
    }
}

function safelySetTextContent(
    id,
    text
) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = text;
    }
}

// ==========================================
// 9. PROPERTY AVAILABILITY
// ==========================================

function getPropertyAvailability(
    property
) {
    const rooms =
        Array.isArray(property.rooms)
            ? property.rooms
            : [];

    if (rooms.length === 0) {
        return "Sold Out";
    }

    const availableBeds =
        rooms.reduce(
            (total, room) => {
                return (
                    total +
                    Number(
                        room.availableBeds || 0
                    )
                );
            },
            0
        );

    if (availableBeds <= 0) {
        return "Sold Out";
    }

    if (availableBeds <= 2) {
        return "Few Left";
    }

    return "Available";
}

// ==========================================
// 10. RENDER TABLE
// ==========================================

function renderTable() {
    const tbody =
        document.getElementById(
            "propertiesTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyTableState"
        );

    const countElement =
        document.getElementById(
            "propertyCount"
        );

    if (!tbody) return;

    const searchInput =
        document.getElementById(
            "searchProperty"
        );

    const typeSelect =
        document.getElementById(
            "filterType"
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

    const typeFilter =
        typeSelect
            ? typeSelect.value
            : "All";

    const statusFilter =
        statusSelect
            ? statusSelect.value
            : "All";

    const filtered =
        propertiesStore.filter(
            (property) => {
                const name =
                    getSafeString(
                        property.name
                    ).toLowerCase();

                const location =
                    getSafeString(
                        property.location
                    ).toLowerCase();

                const matchesSearch =
                    name.includes(query) ||
                    location.includes(query);

                const matchesType =
                    typeFilter === "All" ||
                    property.propertyType ===
                    typeFilter;

                const availability =
                    getPropertyAvailability(
                        property
                    );

                const matchesStatus =
                    statusFilter === "All" ||
                    availability ===
                    statusFilter;

                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus
                );
            }
        );

    if (countElement) {
        countElement.textContent =
            `${filtered.length} Properties Total`;
    }

    tbody.innerHTML = "";

    if (filtered.length === 0) {
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

    const SVG_ROOMS = `
        <svg width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11"
                x2="12" y2="17"></line>
            <line x1="9" y1="14"
                x2="15" y2="14"></line>
        </svg>
    `;

    const SVG_EDIT = `
        <svg width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    `;

    const SVG_DELETE = `
        <svg width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
        </svg>
    `;

    filtered.forEach(
        (property) => {
            const rooms =
                Array.isArray(
                    property.rooms
                )
                    ? property.rooms
                    : [];

            const availableRooms =
                rooms.filter(
                    (room) =>
                        room.status ===
                        "Available" &&
                        Number(
                            room.availableBeds
                        ) > 0
                ).length;

            const totalRooms =
                rooms.length;

            const availability =
                getPropertyAvailability(
                    property
                );

            let statusClass =
                "status-available";

            if (
                availability ===
                "Few Left"
            ) {
                statusClass =
                    "status-few";
            }

            if (
                availability ===
                "Sold Out"
            ) {
                statusClass =
                    "status-soldout";
            }

            const tr =
                document.createElement(
                    "tr"
                );

            // Property
            const tdProperty =
                document.createElement(
                    "td"
                );

            const cellWrap =
                document.createElement(
                    "div"
                );

            cellWrap.className =
                "prop-cell-wrap";

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                getSafeString(
                    property.image,
                    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=700&q=80"
                );

            image.alt = "cover";
            image.className =
                "prop-img-mini";

            const textWrap =
                document.createElement(
                    "div"
                );

            const propertyName =
                document.createElement(
                    "div"
                );

            propertyName.className =
                "prop-name";

            propertyName.textContent =
                getSafeString(
                    property.name
                );

            const propertyId =
                document.createElement(
                    "div"
                );

            propertyId.className =
                "prop-id";

            propertyId.textContent =
                `ID: ${property.id}`;

            textWrap.appendChild(
                propertyName
            );

            textWrap.appendChild(
                propertyId
            );

            cellWrap.appendChild(
                image
            );

            cellWrap.appendChild(
                textWrap
            );

            tdProperty.appendChild(
                cellWrap
            );

            tr.appendChild(
                tdProperty
            );

            // Type + Location
            const tdLocation =
                document.createElement(
                    "td"
                );

            const typeTag =
                document.createElement(
                    "span"
                );

            typeTag.className =
                "type-tag";

            typeTag.textContent =
                getSafeString(
                    property.propertyType
                );

            const locationText =
                document.createElement(
                    "span"
                );

            locationText.className =
                "loc-text";

            locationText.textContent =
                getSafeString(
                    property.location
                );

            tdLocation.appendChild(
                typeTag
            );

            tdLocation.appendChild(
                locationText
            );

            tr.appendChild(
                tdLocation
            );

            // Rent
            const tdRent =
                document.createElement(
                    "td"
                );

            tdRent.className =
                "rent-val";

            tdRent.textContent =
                `₹${formatSafeCurrency(
                    property.rent
                )}`;

            tr.appendChild(
                tdRent
            );

            // Rooms
            const tdRooms =
                document.createElement(
                    "td"
                );

            const activeSpan =
                document.createElement(
                    "span"
                );

            activeSpan.style.fontWeight =
                "600";

            activeSpan.style.color =
                "var(--text-main)";

            activeSpan.textContent =
                availableRooms;

            tdRooms.appendChild(
                activeSpan
            );

            tdRooms.appendChild(
                document.createTextNode(
                    ` / ${totalRooms} Configs`
                )
            );

            tr.appendChild(
                tdRooms
            );

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
                availability;

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

            tdActions.className =
                "text-right";

            const buttonGroup =
                document.createElement(
                    "div"
                );

            buttonGroup.className =
                "action-btn-group";

            const roomsButton =
                document.createElement(
                    "button"
                );

            roomsButton.className =
                "btn-action-small";

            roomsButton.title =
                "Manage Rooms";

            roomsButton.innerHTML =
                SVG_ROOMS;

            roomsButton.addEventListener(
                "click",
                () =>
                    openRoomsModal(
                        property.id
                    )
            );

            const editButton =
                document.createElement(
                    "button"
                );

            editButton.className =
                "btn-action-small primary";

            editButton.title =
                "Edit Property";

            editButton.innerHTML =
                SVG_EDIT;

            editButton.addEventListener(
                "click",
                () =>
                    openPropertyModal(
                        property.id
                    )
            );

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.className =
                "btn-action-small danger";

            deleteButton.title =
                "Delete Property";

            deleteButton.innerHTML =
                SVG_DELETE;

            deleteButton.addEventListener(
                "click",
                () =>
                    confirmDelete(
                        property.id
                    )
            );

            buttonGroup.appendChild(
                roomsButton
            );

            buttonGroup.appendChild(
                editButton
            );

            buttonGroup.appendChild(
                deleteButton
            );

            tdActions.appendChild(
                buttonGroup
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
// 11. FILTERS
// ==========================================

function bindFilterEvents() {
    bindSafeEvent(
        "searchProperty",
        "input",
        renderTable
    );

    bindSafeEvent(
        "filterType",
        "change",
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
                "searchProperty",
                ""
            );

            safelySetInputValue(
                "filterType",
                "All"
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
// 12. MODALS
// ==========================================

function bindModalEvents() {

    // Add Property
    bindSafeEvent(
        "addPropertyBtn",
        "click",
        () => {
            const form =
                document.getElementById(
                    "propertyForm"
                );

            if (form) {
                form.reset();
            }

            safelySetInputValue(
                "propId",
                ""
            );

            safelySetTextContent(
                "propertyModalTitle",
                "Add New Property"
            );

            const overlay =
                document.getElementById(
                    "propertyModalOverlay"
                );

            if (overlay) {
                overlay.classList.add(
                    "visible"
                );
            }
        }
    );

    // Close property modal
    const closePropertyModal = () => {
        const overlay =
            document.getElementById(
                "propertyModalOverlay"
            );

        if (overlay) {
            overlay.classList.remove(
                "visible"
            );
        }
    };

    bindSafeEvent(
        "closePropertyModal",
        "click",
        closePropertyModal
    );

    bindSafeEvent(
        "cancelPropertyBtn",
        "click",
        closePropertyModal
    );

    // ======================================
    // PROPERTY SAVE
    // ======================================

    bindSafeEvent(
        "propertyForm",
        "submit",
        async (event) => {
            event.preventDefault();

            const idInput =
                document.getElementById(
                    "propId"
                );

            const idValue =
                idInput
                    ? idInput.value.trim()
                    : "";

            const nameInput =
                document.getElementById(
                    "propName"
                );

            const typeInput =
                document.getElementById(
                    "propType"
                );

            const locationInput =
                document.getElementById(
                    "propLocation"
                );

            const rentInput =
                document.getElementById(
                    "propRent"
                );

            const depositInput =
                document.getElementById(
                    "propDeposit"
                );

            const imageInput =
                document.getElementById(
                    "propImage"
                );

            if (
                !nameInput ||
                !typeInput ||
                !locationInput ||
                !rentInput ||
                !depositInput
            ) {
                return;
            }

            const name =
                nameInput.value.trim();

            const propertyType =
                typeInput.value;

            const locationText =
                locationInput.value.trim();

            const rent =
                getSafeNumber(
                    rentInput.value,
                    -1
                );

            const deposit =
                getSafeNumber(
                    depositInput.value,
                    -1
                );

            const image =
                imageInput &&
                    imageInput.value.trim()
                    ? imageInput.value.trim()
                    : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=700&q=80";

            // Validation
            if (!name || !locationText) {
                alert(
                    "Property Name and Location are required."
                );

                return;
            }

            if (
                !["PG", "Hostel"].includes(
                    propertyType
                )
            ) {
                alert(
                    "Invalid Property Type."
                );

                return;
            }

            if (rent <= 0) {
                alert(
                    "Base Monthly Rent must be greater than 0."
                );

                return;
            }

            if (deposit < 0) {
                alert(
                    "Security Deposit must be 0 or greater."
                );

                return;
            }

            // ==================================
            // EXISTING PROPERTY
            // ==================================

            const existingProperty =
                idValue
                    ? propertiesStore.find(
                        (property) =>
                            String(
                                property.id
                            ) ===
                            String(idValue)
                    )
                    : null;

            const originalProperty =
                existingProperty?.originalProperty ||
                null;

            // ==================================
            // LOCATION
            // ==================================

            const locationParts =
                locationText
                    .split(",")
                    .map(
                        (part) =>
                            part.trim()
                    )
                    .filter(Boolean);

            let city = "";
            let state = "";
            let address = "";

            if (
                locationParts.length >= 3
            ) {
                city =
                    locationParts[
                    locationParts.length -
                    2
                    ];

                state =
                    locationParts[
                    locationParts.length -
                    1
                    ];

                address =
                    locationParts
                        .slice(
                            0,
                            locationParts.length -
                            2
                        )
                        .join(", ");
            } else if (locationParts.length === 2) {
                address = locationParts[0];

                city = locationParts[1];

                state = "Maharashtra";
            } else {
                address =
                    locationText;

                city =
                    originalProperty?.location
                        ?.city || "";

                state =
                    originalProperty?.location
                        ?.state || "";
            }

            // ==================================
            // PRESERVE REQUIRED BACKEND DATA
            // ==================================

            const originalCoordinates =
                originalProperty
                    ?.location
                    ?.coordinates;

            let coordinates;

            if (
                originalCoordinates &&
                Array.isArray(
                    originalCoordinates.coordinates
                ) &&
                originalCoordinates.coordinates.length ===
                2
            ) {
                coordinates = {
                    type: "Point",

                    coordinates:
                        originalCoordinates.coordinates
                };
            } else {
                /*
                 * Temporary fallback for properties
                 * that don't have coordinates.
                 *
                 * A future version should allow the
                 * admin to enter real latitude/longitude.
                 */
                coordinates = {
                    type: "Point",
                    coordinates: [0, 0]
                };
            }

            // ==================================
            // FINAL BACKEND PAYLOAD
            // ==================================

            const propertyData = {
                name,

                description:
                    originalProperty?.description ||
                    "PG / Hostel accommodation",

                propertyType,

                location: {
                    address,
                    city,
                    state,
                    coordinates
                },

                rentFrom: rent,

                deposit,

                facilities:
                    Array.isArray(
                        originalProperty?.facilities
                    )
                        ? originalProperty.facilities
                        : [],

                images: [image],

                rules:
                    Array.isArray(
                        originalProperty?.rules
                    )
                        ? originalProperty.rules
                        : [],

                gender:
                    originalProperty?.gender ||
                    "Any",

                contact:
                    originalProperty?.contact ||
                    {
                        phone: "",
                        email: ""
                    },

                status:
                    originalProperty?.status ||
                    "Active"
            };

            try {

                // ==================================
                // EDIT PROPERTY
                // ==================================

                if (idValue) {

                    const response =
                        await fetch(
                            `${API_BASE_URL}/properties/${idValue}`,
                            {
                                method: "PUT",

                                headers:
                                    getAuthHeaders(),

                                body:
                                    JSON.stringify(
                                        propertyData
                                    )
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.success
                    ) {
                        console.error(
                            "Update property backend response:",
                            data
                        );

                        throw new Error(
                            data.message ||
                            data.error ||
                            "Failed to update property"
                        );
                    }

                    alert(
                        "Property updated successfully."
                    );
                }

                // ==================================
                // ADD PROPERTY
                // ==================================

                else {

                    const response =
                        await fetch(
                            `${API_BASE_URL}/properties`,
                            {
                                method: "POST",

                                headers:
                                    getAuthHeaders(),

                                body:
                                    JSON.stringify(
                                        propertyData
                                    )
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.success
                    ) {
                        console.error(
                            "Create property backend response:",
                            data
                        );

                        throw new Error(
                            data.message ||
                            data.error ||
                            "Failed to create property"
                        );
                    }

                    alert(
                        "Property added successfully."
                    );
                }

                await loadData();

                renderTable();

                closePropertyModal();

            } catch (error) {

                console.error(
                    "Property save error:",
                    error
                );

                alert(
                    error.message ||
                    "Failed to save property."
                );
            }
        }
    );

    // ======================================
    // DELETE MODAL
    // ======================================

    const closeDeleteModal = () => {
        deleteTargetId = null;

        const overlay =
            document.getElementById(
                "deleteModalOverlay"
            );

        if (overlay) {
            overlay.classList.remove(
                "visible"
            );
        }
    };

    bindSafeEvent(
        "cancelDeleteBtn",
        "click",
        closeDeleteModal
    );

    bindSafeEvent(
        "confirmDeleteBtn",
        "click",
        async () => {

            if (!deleteTargetId) {
                return;
            }

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/properties/${deleteTargetId}`,
                        {
                            method: "DELETE",

                            headers:
                                getAuthHeaders()
                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        "Failed to delete property."
                    );
                }

                alert(
                    "Property deleted successfully."
                );

                await loadData();

                renderTable();

            } catch (error) {

                console.error(
                    "Property deletion error:",
                    error
                );

                alert(
                    error.message ||
                    "Failed to delete property."
                );
            }

            closeDeleteModal();
        }
    );

    // ======================================
    // ROOMS MODAL
    // ======================================

    const closeRoomsModal = () => {
        const overlay =
            document.getElementById(
                "roomsModalOverlay"
            );

        if (overlay) {
            overlay.classList.remove(
                "visible"
            );
        }

        currentRoomsPropId = null;
        currentRoomsStore = [];
    };

    bindSafeEvent(
        "closeRoomsModal",
        "click",
        closeRoomsModal
    );

    // ======================================
    // ADD ROOM
    // ======================================

    bindSafeEvent(
        "addRoomForm",
        "submit",
        async (event) => {

            event.preventDefault();

            if (!currentRoomsPropId) {
                return;
            }

            const typeInput =
                document.getElementById(
                    "newRoomType"
                );

            const rentInput =
                document.getElementById(
                    "newRoomRent"
                );

            const capacityInput =
                document.getElementById(
                    "newRoomCapacity"
                );

            const statusInput =
                document.getElementById(
                    "newRoomStatus"
                );

            if (
                !typeInput ||
                !rentInput ||
                !capacityInput ||
                !statusInput
            ) {
                return;
            }

            const roomType =
                typeInput.value.trim();

            const rent =
                getSafeNumber(
                    rentInput.value,
                    -1
                );

            const capacity =
                parseInt(
                    capacityInput.value,
                    10
                );

            const statusValue =
                statusInput.value;

            if (!roomType) {
                alert(
                    "Room Type is required."
                );

                return;
            }

            if (rent <= 0) {
                alert(
                    "Room Rent must be greater than 0."
                );

                return;
            }

            if (
                Number.isNaN(capacity) ||
                capacity <= 0
            ) {
                alert(
                    "Room Capacity must be greater than 0."
                );

                return;
            }

            const roomStatus =
                statusValue === "true"
                    ? "Available"
                    : "Full";

            const roomData = {
                roomNumber:
                    `R-${Date.now()}`,

                roomType,

                rent,

                capacity,

                availableBeds:
                    roomStatus === "Available"
                        ? capacity
                        : 0,

                facilities: [],

                status:
                    roomStatus
            };

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/rooms/property/${currentRoomsPropId}`,
                        {
                            method: "POST",

                            headers:
                                getAuthHeaders(),

                            body:
                                JSON.stringify(
                                    roomData
                                )
                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        "Failed to add room."
                    );
                }

                alert(
                    "Room added successfully."
                );

                const form =
                    document.getElementById(
                        "addRoomForm"
                    );

                if (form) {
                    form.reset();
                }

                currentRoomsStore =
                    await loadRoomsForProperty(
                        currentRoomsPropId
                    );

                renderRoomsTable();

                await loadData();

                renderTable();

            } catch (error) {

                console.error(
                    "Room creation error:",
                    error
                );

                alert(
                    error.message ||
                    "Failed to add room."
                );
            }
        }
    );

    // ======================================
    // BACKDROP
    // ======================================

    [
        "propertyModalOverlay",
        "roomsModalOverlay",
        "deleteModalOverlay"
    ].forEach((id) => {

        const overlay =
            document.getElementById(id);

        if (!overlay) return;

        overlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target.id ===
                    "propertyModalOverlay"
                ) {
                    closePropertyModal();
                }

                if (
                    event.target.id ===
                    "roomsModalOverlay"
                ) {
                    closeRoomsModal();
                }

                if (
                    event.target.id ===
                    "deleteModalOverlay"
                ) {
                    closeDeleteModal();
                }
            }
        );
    });

    // ======================================
    // ESCAPE
    // ======================================

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key !== "Escape" &&
                event.key !== "Esc"
            ) {
                return;
            }

            const propertyOverlay =
                document.getElementById(
                    "propertyModalOverlay"
                );

            const roomsOverlay =
                document.getElementById(
                    "roomsModalOverlay"
                );

            const deleteOverlay =
                document.getElementById(
                    "deleteModalOverlay"
                );

            if (
                propertyOverlay &&
                propertyOverlay.classList.contains(
                    "visible"
                )
            ) {
                closePropertyModal();
            }

            if (
                roomsOverlay &&
                roomsOverlay.classList.contains(
                    "visible"
                )
            ) {
                closeRoomsModal();
            }

            if (
                deleteOverlay &&
                deleteOverlay.classList.contains(
                    "visible"
                )
            ) {
                closeDeleteModal();
            }
        }
    );
}

// ==========================================
// 13. OPEN PROPERTY MODAL
// ==========================================

window.openPropertyModal = function (id) {

    const property =
        propertiesStore.find(
            (item) =>
                String(item.id) ===
                String(id)
        );

    if (!property) {
        return;
    }

    safelySetTextContent(
        "propertyModalTitle",
        "Edit Property"
    );

    safelySetInputValue(
        "propId",
        property.id
    );

    safelySetInputValue(
        "propName",
        property.name
    );

    safelySetInputValue(
        "propType",
        property.propertyType
    );

    safelySetInputValue(
        "propLocation",
        property.location
    );

    safelySetInputValue(
        "propAvailability",
        getPropertyAvailability(
            property
        )
    );

    safelySetInputValue(
        "propRent",
        property.rent
    );

    safelySetInputValue(
        "propDeposit",
        property.deposit
    );

    safelySetInputValue(
        "propImage",
        property.image
    );

    const overlay =
        document.getElementById(
            "propertyModalOverlay"
        );

    if (overlay) {
        overlay.classList.add(
            "visible"
        );
    }
};

// ==========================================
// 14. DELETE CONFIRMATION
// ==========================================

window.confirmDelete = function (id) {

    const property =
        propertiesStore.find(
            (item) =>
                String(item.id) ===
                String(id)
        );

    if (!property) {
        return;
    }

    deleteTargetId = id;

    safelySetTextContent(
        "deletePropName",
        property.name
    );

    const overlay =
        document.getElementById(
            "deleteModalOverlay"
        );

    if (overlay) {
        overlay.classList.add(
            "visible"
        );
    }
};

// ==========================================
// 15. OPEN ROOMS MODAL
// ==========================================

window.openRoomsModal =
    async function (id) {

        currentRoomsPropId = id;

        const property =
            propertiesStore.find(
                (item) =>
                    String(item.id) ===
                    String(id)
            );

        if (!property) {
            return;
        }

        safelySetTextContent(
            "roomsModalSubtitle",
            `Managing rooms for: ${getSafeString(
                property.name
            )}`
        );

        currentRoomsStore =
            await loadRoomsForProperty(
                id
            );

        renderRoomsTable();

        const overlay =
            document.getElementById(
                "roomsModalOverlay"
            );

        if (overlay) {
            overlay.classList.add(
                "visible"
            );
        }
    };

// ==========================================
// 16. RENDER ROOMS
// ==========================================

function renderRoomsTable() {

    const tbody =
        document.getElementById(
            "roomsTableBody"
        );

    if (
        !currentRoomsPropId ||
        !tbody
    ) {
        return;
    }

    const rooms =
        Array.isArray(
            currentRoomsStore
        )
            ? currentRoomsStore
            : [];

    tbody.innerHTML = "";

    if (rooms.length === 0) {

        const tr =
            document.createElement(
                "tr"
            );

        const td =
            document.createElement(
                "td"
            );

        td.colSpan = 5;

        td.className =
            "text-center";

        td.style.color =
            "var(--text-muted)";

        td.textContent =
            "No room configurations added yet.";

        tr.appendChild(td);

        tbody.appendChild(tr);

        return;
    }

    const SVG_DELETE = `
        <svg width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <line x1="18" y1="6"
                x2="6" y2="18"></line>
            <line x1="6" y1="6"
                x2="18" y2="18"></line>
        </svg>
    `;

    rooms.forEach((room) => {

        const tr =
            document.createElement(
                "tr"
            );

        // Room Type
        const tdType =
            document.createElement(
                "td"
            );

        tdType.style.fontWeight =
            "700";

        tdType.textContent =
            getSafeString(
                room.roomType
            );

        tr.appendChild(tdType);

        // Rent
        const tdRent =
            document.createElement(
                "td"
            );

        tdRent.style.color =
            "var(--primary)";

        tdRent.style.fontWeight =
            "700";

        tdRent.textContent =
            `₹${formatSafeCurrency(
                room.rent
            )}`;

        tr.appendChild(tdRent);

        // Capacity
        const tdCapacity =
            document.createElement(
                "td"
            );

        tdCapacity.textContent =
            `${room.capacity} Person${Number(room.capacity) === 1
                ? ""
                : "s"
            }`;

        tr.appendChild(
            tdCapacity
        );

        // Status
        const tdStatus =
            document.createElement(
                "td"
            );

        const statusBadge =
            document.createElement(
                "span"
            );

        const isAvailable =
            room.status ===
            "Available" &&
            Number(
                room.availableBeds
            ) > 0;

        statusBadge.className =
            `status-badge ${isAvailable
                ? "status-available"
                : "status-soldout"
            }`;

        statusBadge.textContent =
            isAvailable
                ? `Available (${room.availableBeds} beds)`
                : getSafeString(
                    room.status
                );

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

        tdActions.className =
            "text-right";

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.className =
            "btn-action-small danger";

        deleteButton.style.display =
            "inline-flex";

        deleteButton.title =
            "Delete Room";

        deleteButton.innerHTML =
            SVG_DELETE;

        deleteButton.addEventListener(
            "click",
            () =>
                deleteRoom(
                    room._id
                )
        );

        tdActions.appendChild(
            deleteButton
        );

        tr.appendChild(
            tdActions
        );

        tbody.appendChild(
            tr
        );
    });
}

// ==========================================
// 17. DELETE ROOM
// ==========================================

window.deleteRoom =
    async function (roomId) {

        if (!roomId) {
            return;
        }

        const confirmed =
            confirm(
                "Are you sure you want to delete this room?"
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/rooms/${roomId}`,
                    {
                        method: "DELETE",
                        headers:
                            getAuthHeaders()
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Failed to delete room."
                );
            }

            alert(
                "Room deleted successfully."
            );

            currentRoomsStore =
                await loadRoomsForProperty(
                    currentRoomsPropId
                );

            renderRoomsTable();

            await loadData();

            renderTable();

        } catch (error) {

            console.error(
                "Room deletion error:",
                error
            );

            alert(
                error.message ||
                "Failed to delete room."
            );
        }
    };



