/**
 * PG/Hostel Finder and Room Booking System
 * Registration Page Module (register.js)
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initPasswordToggles();
  initPasswordStrengthMeter();
  initFormValidation();
});

// ==========================================
// 1. Navbar Toggle
// ==========================================
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

// ==========================================
// 2. Password Visibility Toggle
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

// ==========================================
// 3. Password Strength Meter
// ==========================================
function initPasswordStrengthMeter() {
  const passwordInput = document.getElementById("regPassword");
  const strengthContainer = document.querySelector(".password-strength-container");
  const strengthText = document.getElementById("strengthText");

  if (!passwordInput || !strengthContainer || !strengthText) return;

  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    let score = 0;

    if (val.length > 0) {
      // Base score for length
      if (val.length >= 8) score += 1;
      
      // Complexity checks
      if (/[A-Z]/.test(val)) score += 1;
      if (/[0-9]/.test(val)) score += 1;
      if (/[^A-Za-z0-9]/.test(val)) score += 1;
    }

    // Reset classes
    strengthContainer.className = "password-strength-container";

    if (val.length === 0) {
      strengthText.textContent = "Password Strength";
      return;
    }

    // Apply scores
    if (score === 1 || val.length < 8) {
      strengthContainer.classList.add("strength-1");
      strengthText.textContent = "Weak";
    } else if (score === 2) {
      strengthContainer.classList.add("strength-2");
      strengthText.textContent = "Fair";
    } else if (score === 3) {
      strengthContainer.classList.add("strength-3");
      strengthText.textContent = "Good";
    } else if (score === 4) {
      strengthContainer.classList.add("strength-4");
      strengthText.textContent = "Strong";
    }
  });
}

// ==========================================
// 4. Form Validation & Submission
// ==========================================
function initFormValidation() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const nameInput = document.getElementById("regName");
  const emailInput = document.getElementById("regEmail");
  const mobileInput = document.getElementById("regMobile");
  const passwordInput = document.getElementById("regPassword");
  const confirmPasswordInput = document.getElementById("regConfirmPassword");
  const termsCheckbox = document.getElementById("regTerms");
  
  const formMessage = document.getElementById("registerFormMessage");
  const formMessageText = document.getElementById("registerFormMessageText");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let isValid = true;
    let globalError = "";

    clearErrors();

    // Validate Name
    const nameVal = nameInput.value.trim();
    if (nameVal.length < 2) {
      markError(nameInput, "nameError");
      globalError = "Please check highlighted fields.";
      isValid = false;
    }

    // Validate Email
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      markError(emailInput, "emailError");
      globalError = "Please check highlighted fields.";
      isValid = false;
    }

    // Validate Indian Mobile Number
    const mobileVal = mobileInput.value.trim();
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileVal)) {
      markError(mobileInput, "mobileError");
      globalError = "Please check highlighted fields.";
      isValid = false;
    }

    // Validate Password
    const passwordVal = passwordInput.value;
    if (passwordVal.length < 8 || !/[0-9]/.test(passwordVal)) {
      markError(passwordInput, "passwordError");
      globalError = "Please check highlighted fields.";
      isValid = false;
    }

    // Confirm Password
    const confirmVal = confirmPasswordInput.value;
    if (confirmVal !== passwordVal || confirmVal === "") {
      markError(confirmPasswordInput, "confirmPasswordError");
      globalError = "Please check highlighted fields.";
      isValid = false;
    }

    // Validate T&C
    if (!termsCheckbox.checked) {
      document.getElementById("termsError").classList.add("visible");
      globalError = globalError || "You must accept the Terms of Service.";
      isValid = false;
    }

    // Check existing users (Mock DB)
    if (isValid) {
      let existingUsers = [];
      try {
        existingUsers = JSON.parse(localStorage.getItem("pg_demo_users")) || [];
      } catch (err) {
        existingUsers = [];
      }
      const userExists = existingUsers.some(user => user.email === emailVal);
      
      if (userExists) {
        markError(emailInput, null);
        globalError = "This email is already registered. Please login.";
        isValid = false;
      }
    }

    // Handle Failure
    if (!isValid) {
      if (formMessage && formMessageText) {
        formMessage.classList.add("visible");
        formMessageText.textContent = globalError;
      }
      return;
    }

    // Handle Success
    processRegistration(nameVal, emailVal, mobileVal, passwordVal);
  });

  // Clear errors on input
  const allInputs = [nameInput, emailInput, mobileInput, passwordInput, confirmPasswordInput];
  allInputs.forEach(input => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      const errorMsg = document.getElementById(`${input.id.replace('reg', '').toLowerCase()}Error`);
      if (errorMsg) errorMsg.classList.remove("visible");
      if (formMessage) formMessage.classList.remove("visible");
    });
  });

  termsCheckbox.addEventListener("change", () => {
    document.getElementById("termsError").classList.remove("visible");
    if (formMessage) formMessage.classList.remove("visible");
  });
}

function markError(inputElement, errorSpanId) {
  inputElement.classList.add("input-error");
  if (errorSpanId) {
    const span = document.getElementById(errorSpanId);
    if (span) span.classList.add("visible");
  }
}

function clearErrors() {
  document.querySelectorAll(".auth-input").forEach(el => el.classList.remove("input-error"));
  document.querySelectorAll(".field-error-msg").forEach(el => el.classList.remove("visible"));
  const banner = document.getElementById("registerFormMessage");
  if (banner) banner.classList.remove("visible");
}

async function processRegistration(name, email, mobile, password) {
  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        email: email,
        mobile: mobile,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const formMessage = document.getElementById("registerFormMessage");
      const formMessageText = document.getElementById("registerFormMessageText");

      if (formMessage && formMessageText) {
        formMessage.classList.add("visible");
        formMessageText.textContent =
          data.message || "Registration failed. Please try again.";
      }

      return;
    }

    // Show success state
    const successOverlay = document.getElementById("registerSuccessState");

    if (successOverlay) {
      successOverlay.classList.add("visible");
    }

    // Redirect to login
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2500);

  } catch (error) {
    console.error("Registration error:", error);

    const formMessage = document.getElementById("registerFormMessage");
    const formMessageText = document.getElementById("registerFormMessageText");

    if (formMessage && formMessageText) {
      formMessage.classList.add("visible");
      formMessageText.textContent =
        "Unable to connect to the server. Please try again.";
    }
  }
}