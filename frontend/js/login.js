/**
 * PG/Hostel Finder and Room Booking System
 * Login Page Module (login.js)
 *
 * Authenticates users through the Node.js + Express backend.
 * Handles role-based access control and redirects.
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initPasswordToggle();
  initRememberMe();
  initLoginForm();
});

// ==========================================
// 1. Navbar Toggle
// ==========================================
function initMobileNav() {
  const navToggleBtn = document.getElementById("navToggleBtn");
  const navMenu = document.getElementById("navMenu");

  if (!navToggleBtn || !navMenu) return;

  navToggleBtn.addEventListener("click", () => {
    const isExpanded =
      navToggleBtn.getAttribute("aria-expanded") === "true";

    navToggleBtn.setAttribute("aria-expanded", String(!isExpanded));
    navMenu.classList.toggle("is-open");
  });
}

// ==========================================
// 2. Password Visibility Toggle
// ==========================================
function initPasswordToggle() {
  const toggleBtns = document.querySelectorAll(".password-toggle-btn");

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);

      if (!input) return;

      const iconShow = btn.querySelector(".icon-show");
      const iconHide = btn.querySelector(".icon-hide");

      if (input.type === "password") {
        input.type = "text";
        btn.setAttribute("aria-label", "Hide password");

        if (iconShow) iconShow.style.display = "none";
        if (iconHide) iconHide.style.display = "block";
      } else {
        input.type = "password";
        btn.setAttribute("aria-label", "Show password");

        if (iconShow) iconShow.style.display = "block";
        if (iconHide) iconHide.style.display = "none";
      }
    });
  });
}

// ==========================================
// 3. Remember Me — Pre-fill & Persist
// ==========================================
const REMEMBER_KEY = "pg_remembered_email";

function initRememberMe() {
  const emailInput = document.getElementById("loginEmail");
  const rememberCheckbox = document.getElementById("loginRemember");

  if (!emailInput || !rememberCheckbox) return;

  try {
    const saved = localStorage.getItem(REMEMBER_KEY);

    if (saved) {
      emailInput.value = saved;
      rememberCheckbox.checked = true;
    }
  } catch (_) {
    // Fail silently if storage is unavailable
  }
}

function updateRememberMe(email) {
  const rememberCheckbox = document.getElementById("loginRemember");

  if (!rememberCheckbox) return;

  try {
    if (rememberCheckbox.checked && email) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch (_) {
    // Fail silently
  }
}

// ==========================================
// 4. Login Form Validation & Submission
// ==========================================
function initLoginForm() {
  const form = document.getElementById("loginForm");

  if (!form) return;

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    clearErrors();

    // ======================================
    // Get Selected Role
    // ======================================
    const roleSelector = document.querySelector(
      'input[name="loginRole"]:checked'
    );

    const roleVal = roleSelector ? roleSelector.value : "user";

    // ======================================
    // Validate Email
    // ======================================
    const emailVal = emailInput.value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailVal || !emailRegex.test(emailVal)) {
      markError(emailInput, "emailError");
      isValid = false;
    }

    // ======================================
    // Validate Password
    // ======================================
    const passwordVal = passwordInput.value;

    if (!passwordVal) {
      markError(passwordInput, "passwordError");
      isValid = false;
    }

    if (!isValid) {
      showFormMessage(
        "Please check the highlighted fields.",
        "error"
      );
      return;
    }

    // ======================================
    // Disable Submit Button
    // ======================================
    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    let originalButtonText = "";

    if (submitButton) {
      if (submitButton.tagName === "BUTTON") {
        originalButtonText = submitButton.textContent;
        submitButton.textContent = "Signing in...";
      }

      submitButton.disabled = true;
    }

    // ======================================
    // Authenticate With Backend
    // ======================================
    try {
      const response = await fetch(
        "https://pg-hostel-finder-yevr.onrender.com/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: emailVal,
            password: passwordVal
          })
        }
      );

      const data = await response.json();

      // ====================================
      // Backend Login Failed
      // ====================================
      if (!response.ok || !data.success) {
        showFormMessage(
          data.message ||
            "Invalid email or password. Please try again.",
          "error"
        );

        return;
      }

      // ====================================
      // Validate Backend Response
      // ====================================
      if (!data.user || !data.token) {
        showFormMessage(
          "Invalid response received from server.",
          "error"
        );

        return;
      }

      // ====================================
      // Backend Role Validation
      // ====================================
      if (data.user.role !== roleVal) {
        showFormMessage(
          `Access denied. This account does not have ${roleVal} privileges.`,
          "error"
        );

        return;
      }

      // ====================================
      // Remember Me
      // ====================================
      updateRememberMe(emailVal);

      // ====================================
      // Create Frontend Session
      // ====================================
      const sessionData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        mobile: data.user.mobile,
        role: data.user.role,
        loggedInAt: new Date().toISOString()
      };

      try {
        sessionStorage.setItem(
          "pg_current_user",
          JSON.stringify(sessionData)
        );

        sessionStorage.setItem(
          "pg_token",
          data.token
        );
      } catch (_) {
        showFormMessage(
          "Unable to create session. Please try again.",
          "error"
        );

        return;
      }

      // ====================================
      // Login Successful
      // ====================================
      const successOverlay = document.getElementById(
        "loginSuccessState"
      );

      if (successOverlay) {
        successOverlay.classList.add("visible");
      }

      // ====================================
      // Redirect
      // ====================================
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href =
            "admin/dashboard.html";
        } else {
          window.location.href =
            "dashboard.html";
        }
      }, 2000);

    } catch (error) {
      console.error("Login error:", error);

      showFormMessage(
        "Unable to connect to the server. Please make sure the backend is running.",
        "error"
      );

    } finally {
      // ====================================
      // Re-enable Submit Button
      // ====================================
      if (submitButton) {
        submitButton.disabled = false;

        if (submitButton.tagName === "BUTTON") {
          submitButton.textContent = originalButtonText;
        }
      }
    }
  });

  // ==========================================
  // Clear Errors on Input
  // ==========================================
  [emailInput, passwordInput].forEach((input) => {
    if (!input) return;

    input.addEventListener("input", () => {
      input.classList.remove("input-error");

      const fieldName = input.id
        .replace("login", "")
        .toLowerCase();

      const errorSpan = document.getElementById(
        `${fieldName}Error`
      );

      if (errorSpan) {
        errorSpan.classList.remove("visible");
      }

      hideFormMessage();
    });
  });

  // ==========================================
  // Clear Banner on Role Change
  // ==========================================
  document
    .querySelectorAll('input[name="loginRole"]')
    .forEach((radio) => {
      radio.addEventListener(
        "change",
        hideFormMessage
      );
    });
}

// ==========================================
// 5. Utility Functions
// ==========================================
function markError(inputElement, errorSpanId) {
  if (inputElement) {
    inputElement.classList.add("input-error");
  }

  if (errorSpanId) {
    const span = document.getElementById(errorSpanId);

    if (span) {
      span.classList.add("visible");
    }
  }
}

function clearErrors() {
  document
    .querySelectorAll(".auth-input")
    .forEach((el) => {
      el.classList.remove("input-error");
    });

  document
    .querySelectorAll(".field-error-msg")
    .forEach((el) => {
      el.classList.remove("visible");
    });

  hideFormMessage();
}

function showFormMessage(message, type) {
  const banner = document.getElementById(
    "loginFormMessage"
  );

  const text = document.getElementById(
    "loginFormMessageText"
  );

  if (!banner || !text) return;

  text.textContent = message;

  banner.classList.remove("message-success");

  if (type === "success") {
    banner.classList.add("message-success");
  }

  banner.classList.add("visible");
}

function hideFormMessage() {
  const banner = document.getElementById(
    "loginFormMessage"
  );

  if (banner) {
    banner.classList.remove(
      "visible",
      "message-success"
    );
  }
}

