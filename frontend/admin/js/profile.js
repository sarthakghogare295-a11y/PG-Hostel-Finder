const API_BASE_URL = "https://pg-hostel-finder-yevr.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const user = checkAdminAuth();
  if (!user) return;

  initSidebar();
  initLogout();
  setupAdminProfile(user);
  
  populateProfileForm(user);
  setupFormListeners();
  
  document.getElementById("adminContent").style.display = "block";
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================
function checkAdminAuth() {
  let user = null;
  const token = sessionStorage.getItem("pg_token");
  const userData = sessionStorage.getItem("pg_current_user");

  if (!token || !userData) {
    window.location.href = "../login.html";
    return null;
  }

  try {
    user = JSON.parse(userData);
    if (user.role !== "admin") {
      window.location.href = "../index.html";
      return null;
    }
  } catch (error) {
    console.error("Admin authentication error:", error);
    window.location.href = "../login.html";
    return null;
  }

  return user;
}

// ==========================================
// SIDEBAR & LOGOUT
// ==========================================
function initSidebar() {
  const toggleBtn = document.getElementById("adminMenuBtn");
  const closeBtn = document.getElementById("sidebarCloseBtn");
  const sidebar = document.getElementById("adminSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");

  if (!toggleBtn || !sidebar || !backdrop || !closeBtn) return;

  const openSidebar = () => {
    sidebar.classList.add("is-open");
    backdrop.classList.add("is-open");
  };

  const closeSidebar = () => {
    sidebar.classList.remove("is-open");
    backdrop.classList.remove("is-open");
  };

  toggleBtn.addEventListener("click", openSidebar);
  closeBtn.addEventListener("click", closeSidebar);
  backdrop.addEventListener("click", closeSidebar);
}

function initLogout() {
  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("pg_token");
      sessionStorage.removeItem("pg_current_user");
      window.location.href = "../login.html";
    });
  }
}

// ==========================================
// NAVBAR PROFILE
// ==========================================
function setupAdminProfile(user) {
  const avatar = document.getElementById("topbarAvatar");
  const name = document.getElementById("topbarName");

  if (avatar && name && user) {
    name.textContent = user.name + " ▾";avatar.textContent = user.name.charAt(0).toUpperCase();
  }
}

// ==========================================
// PROFILE FORM LOGIC
// ==========================================
function populateProfileForm(user) {
  document.getElementById("profileName").value = user.name || "";
  document.getElementById("profileEmail").value = user.email || "";
  document.getElementById("profileMobile").value = user.mobile || "";
  document.getElementById("profileRole").value = user.role || "System Admin ▾";
}

function showMessage(elementId, message, type) {
  const msgEl = document.getElementById(elementId);
  msgEl.textContent = message;
  msgEl.className = `message-box ${type}`;
  msgEl.style.display = "block";

  setTimeout(() => {
    msgEl.style.display = "none";
  }, 5000);
}

function setupFormListeners() {
  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updatePassword();
    });
  }
}

async function updateProfile() {
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const mobile = document.getElementById("profileMobile").value.trim();
  const btn = document.getElementById("updateProfileBtn");
  
  if (!name || !email) {
    showMessage("profileMessage", "Name and email are required", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Updating...";

  try {
    const token = sessionStorage.getItem("pg_token");
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, mobile })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Update session storage
      const currentUser = JSON.parse(sessionStorage.getItem("pg_current_user"));
      currentUser.name = data.user.name || name;
      currentUser.email = data.user.email || email;
      currentUser.mobile = data.user.mobile || mobile;
      sessionStorage.setItem("pg_current_user", JSON.stringify(currentUser));

      // Update navbar
      setupAdminProfile(currentUser);
      
      showMessage("profileMessage", "Profile updated successfully.", "success");
    } else {
      showMessage("profileMessage", data.message || "Failed to update profile.", "error");
    }
  } catch (error) {
    console.error("Profile update error:", error);
    showMessage("profileMessage", "An error occurred while updating profile.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Update Profile";
  }
}

async function updatePassword() {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const btn = document.getElementById("updatePasswordBtn");

  if (!currentPassword || !newPassword || !confirmPassword) {
    showMessage("passwordMessage", "All password fields are required", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("passwordMessage", "New passwords do not match.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Changing...";

  try {
    const token = sessionStorage.getItem("pg_token");
    const res = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showMessage("passwordMessage", "Password changed successfully.", "success");
      document.getElementById("passwordForm").reset();
    } else {
      showMessage("passwordMessage", data.message || "Current password is incorrect.", "error");
    }
  } catch (error) {
    console.error("Password change error:", error);
    showMessage("passwordMessage", "An error occurred while changing password.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Change Password";
  }
}


// Dropdown initialization
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('adminProfileMenuBtn');
  const dropdown = document.getElementById('adminProfileDropdown');
  const topbarLogout = document.getElementById('adminTopbarLogoutBtn');

  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  if (topbarLogout) {
    topbarLogout.addEventListener('click', () => {
      sessionStorage.removeItem("pg_token");
      sessionStorage.removeItem("pg_current_user");
      window.location.href = "../login.html";
    });
  }
});
