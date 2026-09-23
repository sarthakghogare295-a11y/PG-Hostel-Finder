const express = require("express");

const {
    getRoomsByProperty,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
} = require("../controllers/roomController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Public routes
router.get("/property/:propertyId", getRoomsByProperty);
router.get("/:id", getRoomById);

// Admin-only routes
router.post(
    "/property/:propertyId",
    protect,
    adminOnly,
    createRoom
);

router.put(
    "/:id",
    protect,
    adminOnly,
    updateRoom
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteRoom
);

module.exports = router;