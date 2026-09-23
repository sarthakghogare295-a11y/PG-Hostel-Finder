const bcrypt = require("bcryptjs");

const User = require("../models/User");

// Create admin account
const createAdmin = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await User.create({
            name,
            email: email.toLowerCase(),
            mobile,
            password: hashedPassword,
            role: "admin",
            status: "active"
        });

        res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                mobile: admin.mobile,
                role: admin.role,
                status: admin.status
            }
        });

    } catch (error) {
        console.error("Create admin error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating admin"
        });
    }
};


// Reset admin password - Development use
const resetAdminPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email and new password are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const admin = await User.findOne({
            email: email.toLowerCase(),
            role: "admin"
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        admin.password = hashedPassword;
        await admin.save();

        res.status(200).json({
            success: true,
            message: "Admin password reset successfully"
        });

    } catch (error) {
        console.error("Reset admin password error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while resetting admin password"
        });
    }
};

module.exports = {
    createAdmin,
    resetAdminPassword
};