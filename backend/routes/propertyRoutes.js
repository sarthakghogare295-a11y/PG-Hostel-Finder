const express = require("express");

const {
    getProperties,
    getPropertyById,
    getNearbyProperties,
    createProperty,
    updateProperty,
    deleteProperty
} = require("../controllers/propertyController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Public routes
router.get("/", getProperties);
router.get("/nearby", getNearbyProperties);
router.get("/:id", getPropertyById);

// Admin-only routes
router.post("/", protect, adminOnly, createProperty);
router.put("/:id", protect, adminOnly, updateProperty);
router.delete("/:id", protect, adminOnly, deleteProperty);

module.exports = router;