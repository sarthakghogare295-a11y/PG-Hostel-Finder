const express = require("express");

const {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getAllBookings,
    getAdminBookingById,
    updateBookingStatus
} = require("../controllers/bookingController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Create booking - authenticated users only
router.post("/", protect, createBooking);

// Get current user's bookings
router.get("/my", protect, getMyBookings);

// Admin - get all bookings
router.get("/admin/all", protect, adminOnly, getAllBookings);

// Admin - get single booking
router.get("/admin/:id", protect, adminOnly, getAdminBookingById);

// Admin - update booking status
router.patch(
    "/admin/:id/status",
    protect,
    adminOnly,
    updateBookingStatus
);

// Get single booking - current user only
router.get("/:id", protect, getBookingById);

// Cancel booking - current user only
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;