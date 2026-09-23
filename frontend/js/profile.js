/**
 * PG/Hostel Finder and Room Booking System
 * My Profile Page Module (profile.js)
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  
  const user = checkAuthentication();
  if (!user) return; // Halt rendering if auth guard is shown

  initLogout();
  populateProfileData(user);
  initPasswordToggles();
  initProfileForm(user);
  initPasswordForm(user);
});

// ==========================================
// 1. AUTHENTICATION & NAVBAR
// ==========================================
function checkAuthentication() {
  const overlay = document.getElementById("authGuardOverlay");
  const main = document.getElementById("profileMain");
  
  let user = null;
  try {
    const rawUser = sessionStorage.getItem("pg_current_user");
    if (!rawUser) {
      showAuthGuard(overlay, main);
      return null;
    }
    
    user = JSON.parse(rawUser);
    if (!user || typeof user !== "object" || !user.email) {
      showAuthGuard(overlay, main);
      return null;
    }
  } catch (err) {
    showAuthGuard(overlay, main);
    return null;
  }

  // Hide guard overlay, display main content
  if (overlay) overlay.classList.remove("visible");
  if (main) main.style.display = "block";

  // Setup navbar display
  const avatarEl = document.getElementById("navUserAvatar");
  const nameEl = document.getElementById("navUserName");

  if (avatarEl && user.name) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }
  if (nameEl && user.name) {
    nameEl.textContent = user.name.split(" ")[0];
  }

  return user;
}

function showAuthGuard(overlay, main) {
  if (overlay) overlay.classList.add("visible");
  if (main) main.style.display = "none";
}

function initMobileNav() {
  const navToggleBtn = document.getElementById("navToggleBtn");
  const navMenu = document.getElementById("navMenu");

  if (!navToggleBtn || !navMenu) return;

  navToggleBtn.addEventListener("click", () => {
    const isExpanded = navToggleBtn.getAttribute("aria-expanded") === "true";
    navToggleBtn.setAttribute("aria-expanded", String(!isExpanded));
    navMenu.classList.toggle("is-open");
  });
}

function initLogout() {
  const logoutBtn = document.getElementById("logoutBtnNav");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    try { sessionStorage.removeItem("pg_current_user"); } catch (e) {}
    window.location.href = "login.html";
  });
}

// ==========================================
// 2. POPULATE DATA
// ==========================================
function populateProfileData(user) {
  // Sidebar
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  const sidebarName = document.getElementById("sidebarName");
  const sidebarEmail = document.getElementById("sidebarEmail");
  const sidebarMemberSince = document.getElementById("sidebarMemberSince");

  if (sidebarAvatar && user.name) {
    sidebarAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarEmail) sidebarEmail.textContent = user.email;
  
  if (sidebarMemberSince) {
    const joinDate = getJoinDate(user.email);
    sidebarMemberSince.textContent = `Member since ${formatShortDate(joinDate)}`;
  }

  // Forms
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileMobile = document.getElementById("profileMobile");

  if (profileName) profileName.value = user.name || "";
  if (profileEmail) profileEmail.value = user.email || "";
  if (profileMobile) profileMobile.value = user.mobile || "";
}

function getJoinDate(email) {
  try {
    const raw = localStorage.getItem("pg_demo_users");
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users)) {
        const found = users.find((u) => u.email === email);
        if (found && found.createdAt) return found.createdAt;
      }
    }
  } catch (_) {}

  // Fallback to session login time
  try {
    const session = JSON.parse(sessionStorage.getItem("pg_current_user"));
    if (session && session.loggedInAt) return session.loggedInAt;
  } catch (_) {}

  return new Date().toISOString();
}

function formatShortDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short"
  });
}

// ==========================================
// 3. PROFILE UPDATE FORM
// ==========================================
function initProfileForm(currentUser) {
  const form = document.getElementById("profileForm");
  if (!form) return;

  const nameInput = document.getElementById("profileName");
  const mobileInput = document.getElementById("profileMobile");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors("profileForm");
    hideMessage("profileMessage");

    let isValid = true;

    const nameVal = nameInput.value.trim();
    if (nameVal.length < 2) {
      markError(nameInput, "nameError");
      isValid = false;
    }

    const mobileVal = mobileInput.value.trim();
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(mobileVal)) {
      markError(mobileInput, "mobileError");
      isValid = false;
    }

    if (!isValid) {
      showMessage(
        "profileMessage",
        "Please resolve the highlighted errors.",
        "error"
      );
      return;
    }

    const token = sessionStorage.getItem("pg_token");

    if (!token) {
      showMessage(
        "profileMessage",
        "Session expired. Please log in again.",
        "error"
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: nameVal,
          mobile: mobileVal
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showMessage(
          "profileMessage",
          data.message || "Profile update failed.",
          "error"
        );
        return;
      }

      const updatedUser = data.user;

      sessionStorage.setItem(
        "pg_current_user",
        JSON.stringify(updatedUser)
      );

      populateProfileData(updatedUser);

      const navAvatar = document.getElementById("navUserAvatar");
      const navName = document.getElementById("navUserName");

      if (navAvatar) {
        navAvatar.textContent = nameVal.charAt(0).toUpperCase();
      }

      if (navName) {
        navName.textContent = nameVal.split(" ")[0];
      }

      showMessage(
        "profileMessage",
        "Profile updated successfully.",
        "success"
      );

    } catch (error) {
      console.error("Profile update error:", error);

      showMessage(
        "profileMessage",
        "Unable to connect to the server. Please try again.",
        "error"
      );
    }
  });

  [nameInput, mobileInput].forEach(input => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");

      const errId =
        input.id.replace("profile", "").toLowerCase() + "Error";

      const errorMsg = document.getElementById(errId);

      if (errorMsg) {
        errorMsg.classList.remove("visible");
      }

      hideMessage("profileMessage");
    });
  });
}

// ==========================================
// 4. PASSWORD UPDATE FORM
// ==========================================
function initPasswordForm(currentUser) {
  const form = document.getElementById("passwordForm");
  if (!form) return;

  const currentInput = document.getElementById("currentPassword");
  const newpwdInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmNewPassword");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors("passwordForm");
    hideMessage("passwordMessage");

    let isValid = true;

    const currentVal = currentInput.value;
    const newVal = newpwdInput.value;
    const confirmVal = confirmInput.value;

    if (!currentVal) {
      markError(currentInput, "currentPasswordError");
      isValid = false;
    }

    if (newVal.length < 8 || !/[0-9]/.test(newVal)) {
      markError(newpwdInput, "newPasswordError");
      isValid = false;
    }

    if (confirmVal !== newVal || confirmVal === "") {
      markError(confirmInput, "confirmNewPasswordError");
      isValid = false;
    }

    if (!isValid) {
      showMessage(
        "passwordMessage",
        "Please resolve the highlighted errors.",
        "error"
      );
      return;
    }

    const token = sessionStorage.getItem("pg_token");

    if (!token) {
      showMessage(
        "passwordMessage",
        "Session expired. Please log in again.",
        "error"
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: currentVal,
            newPassword: newVal
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        markError(currentInput, "currentPasswordError");

        const errorElement =
          document.getElementById("currentPasswordError");

        if (errorElement) {
          errorElement.textContent =
            data.message || "Password change failed.";
        }

        showMessage(
          "passwordMessage",
          data.message || "Password change failed.",
          "error"
        );

        return;
      }

      form.reset();

      document
        .querySelectorAll("#passwordForm .password-toggle-btn")
        .forEach(btn => {
          const targetId = btn.getAttribute("data-target");
          const input = document.getElementById(targetId);

          if (input) {
            input.type = "password";
          }

          const iconShow = btn.querySelector(".icon-show");
          const iconHide = btn.querySelector(".icon-hide");

          if (iconShow) iconShow.style.display = "block";
          if (iconHide) iconHide.style.display = "none";
        });

      showMessage(
        "passwordMessage",
        "Password changed successfully.",
        "success"
      );

    } catch (error) {
      console.error("Password change error:", error);

      showMessage(
        "passwordMessage",
        "Unable to connect to the server. Please try again.",
        "error"
      );
    }
  });

  [currentInput, newpwdInput, confirmInput].forEach(input => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");

      const errId = input.id + "Error";
      const errorMsg = document.getElementById(errId);

      if (errorMsg) {
        errorMsg.classList.remove("visible");

        if (input.id === "currentPassword") {
          errorMsg.textContent =
            "Please enter your current password.";
        }
      }

      hideMessage("passwordMessage");
    });
  });
}

// ==========================================
// 5. UTILITIES & TOGGLES
// ==========================================
function initPasswordToggles() {
  const toggleBtns = document.querySelectorAll(".password-toggle-btn");
  
  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      const iconShow = btn.querySelector(".icon-show");
      const iconHide = btn.querySelector(".icon-hide");

      if (input.type === "password") {
        input.type = "text";
        if (iconShow) iconShow.style.display = "none";
        if (iconHide) iconHide.style.display = "block";
      } else {
        input.type = "password";
        if (iconShow) iconShow.style.display = "block";
        if (iconHide) iconHide.style.display = "none";
      }
    });
  });
}

function markError(inputElement, errorSpanId) {
  if (inputElement) inputElement.classList.add("input-error");
  if (errorSpanId) {
    const span = document.getElementById(errorSpanId);
    if (span) span.classList.add("visible");
  }
}

function clearErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll(".profile-input").forEach(el => el.classList.remove("input-error"));
  form.querySelectorAll(".field-error-msg").forEach(el => el.classList.remove("visible"));
}

function showMessage(areaId, text, type) {
  const area = document.getElementById(areaId);
  const textSpan = document.getElementById(areaId + "Text");
  if (!area || !textSpan) return;

  textSpan.textContent = text;
  area.classList.remove("message-success");
  
  if (type === "success") {
    area.classList.add("message-success");
  }
  
  area.classList.add("visible");
}

function hideMessage(areaId) {
  const area = document.getElementById(areaId);
  if (area) {
    area.classList.remove("visible", "message-success");
  }
}