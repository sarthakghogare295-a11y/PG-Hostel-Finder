const express = require("express");

const {
    registerUser,
    loginUser,
    getCurrentUser
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Get currently authenticated user
router.get("/me", protect, getCurrentUser);

module.exports = router;