const mongoose = require("mongoose");
const Room = require("../models/Room");
const Property = require("../models/Property");


// ==========================================
// GET ALL ROOMS FOR A PROPERTY
// ==========================================

const getRoomsByProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        // Check whether property exists
        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const rooms = await Room.find({
            property: propertyId
        }).sort({ roomNumber: 1 });

        res.status(200).json({
            success: true,
            count: rooms.length,
            rooms
        });

    } catch (error) {
        console.error("Get rooms error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching rooms"
        });
    }
};


// ==========================================
// GET SINGLE ROOM
// ==========================================

const getRoomById = async (req, res) => {
    try {

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        const room = await Room.findById(req.params.id)
            .populate("property", "name location");

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.status(200).json({
            success: true,
            room
        });

    } catch (error) {
        console.error("Get room error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching room"
        });
    }
};


// ==========================================
// CREATE ROOM - ADMIN ONLY
// ==========================================

const createRoom = async (req, res) => {
    try {
        const { propertyId } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        // Check whether property exists
        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const room = await Room.create({
            ...req.body,
            property: propertyId
        });

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            room
        });

    } catch (error) {
        console.error("Create room error:", error);

        res.status(400).json({
            success: false,
            message: "Failed to create room",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE ROOM - ADMIN ONLY
// ==========================================

const updateRoom = async (req, res) => {
    try {

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        console.log("UPDATE ROOM BODY:", req.body);

        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const updates = { ...req.body };

        delete updates.property;

        Object.assign(room, updates);

        await room.save();

        res.status(200).json({
            success: true,
            message: "Room updated successfully",
            room
        });

    } catch (error) {
        console.error("Update room error:", error);

        res.status(400).json({
            success: false,
            message: "Failed to update room",
            error: error.message
        });
    }
};


// ==========================================
// DELETE ROOM - ADMIN ONLY
// ==========================================

const deleteRoom = async (req, res) => {
    try {

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        const room = await Room.findByIdAndDelete(
            req.params.id
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Room deleted successfully"
        });

    } catch (error) {
        console.error("Delete room error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting room"
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    getRoomsByProperty,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
};