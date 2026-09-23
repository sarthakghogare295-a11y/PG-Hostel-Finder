const express = require("express");

const {
    getMyProfile,
    updateMyProfile,
    changePassword,
    getAllUsers,
    updateUserByAdmin,
    updateUserStatus,
    deleteUserByAdmin
} = require("../controllers/userController");

const protect =
    require("../middleware/authMiddleware");

const adminOnly =
    require("../middleware/adminMiddleware");

const router = express.Router();


// ==========================================
// CURRENT USER
// ==========================================

router.get(
    "/me",
    protect,
    getMyProfile
);

router.put(
    "/me",
    protect,
    updateMyProfile
);

router.put(
    "/change-password",
    protect,
    changePassword
);


// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================

// Get all users
router.get(
    "/admin/all",
    protect,
    adminOnly,
    getAllUsers
);

// Edit user
router.put(
    "/admin/:id",
    protect,
    adminOnly,
    updateUserByAdmin
);

// Enable / Disable user
router.patch(
    "/admin/:id/status",
    protect,
    adminOnly,
    updateUserStatus
);

// Delete user
router.delete(
    "/admin/:id",
    protect,
    adminOnly,
    deleteUserByAdmin
);


module.exports = router;