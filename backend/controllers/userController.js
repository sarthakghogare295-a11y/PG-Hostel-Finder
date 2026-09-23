const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ==========================================
// GET CURRENT USER PROFILE
// ==========================================
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get profile error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching profile"
        });
    }
};


// ==========================================
// UPDATE CURRENT USER PROFILE
// ==========================================
const updateMyProfile = async (req, res) => {
    try {
        const { name, mobile } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (mobile !== undefined) {
            user.mobile = mobile;
        }

        await user.save();

        const updatedUser = await User.findById(req.user.userId)
            .select("-password");

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update profile error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating profile"
        });
    }
};


// ==========================================
// CHANGE CURRENT USER PASSWORD
// ==========================================
const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 6 characters long"
            });
        }

        const user = await User.findById(
            req.user.userId
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect"
            });
        }

        const salt =
            await bcrypt.genSalt(12);

        user.password =
            await bcrypt.hash(
                newPassword,
                salt
            );

        await user.save();

        res.status(200).json({
            success: true,
            message:
                "Password changed successfully"
        });

    } catch (error) {
        console.error(
            "Change password error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while changing password"
        });
    }
};


// ==========================================
// ADMIN: GET ALL USERS
// ==========================================
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error(
            "Get all users error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching users"
        });
    }
};


// ==========================================
// ADMIN: UPDATE USER
// ==========================================
const updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const { name, mobile } = req.body;

        const user =
            await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent editing account role
        // through this endpoint.
        if (name !== undefined) {
            user.name = name;
        }

        if (mobile !== undefined) {
            user.mobile = mobile;
        }

        await user.save();

        const updatedUser =
            await User.findById(id)
                .select("-password");

        res.status(200).json({
            success: true,
            message:
                "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error(
            "Admin update user error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while updating user"
        });
    }
};


// ==========================================
// ADMIN: UPDATE USER STATUS
// ==========================================
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const { status } = req.body;

        if (
            status !== "active" &&
            status !== "disabled"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be active or disabled"
            });
        }

        const user =
            await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent disabling the currently
        // logged-in admin account.
        if (
            user._id.toString() ===
            req.user.userId
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot disable your own account"
            });
        }

        user.status = status;

        await user.save();

        const updatedUser =
            await User.findById(id)
                .select("-password");

        res.status(200).json({
            success: true,
            message:
                `User status changed to ${status}`,
            user: updatedUser
        });

    } catch (error) {
        console.error(
            "Admin update user status error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while updating user status"
        });
    }
};


// ==========================================
// ADMIN: DELETE USER
// ==========================================
const deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const user =
            await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent deleting the currently
        // logged-in admin account.
        if (
            user._id.toString() ===
            req.user.userId
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot delete your own account"
            });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message:
                "User deleted successfully"
        });

    } catch (error) {
        console.error(
            "Admin delete user error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while deleting user"
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================
module.exports = {
    getMyProfile,
    updateMyProfile,
    changePassword,
    getAllUsers,
    updateUserByAdmin,
    updateUserStatus,
    deleteUserByAdmin
};