const express = require("express");

const {
    addFavorite,
    getMyFavorites,
    removeFavorite
} = require("../controllers/favoriteController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Add property to favorites
router.post("/", protect, addFavorite);

// Get current user's favorites
router.get("/", protect, getMyFavorites);

// Remove property from favorites
router.delete("/:propertyId", protect, removeFavorite);

module.exports = router;