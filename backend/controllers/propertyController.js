const mongoose = require("mongoose");
const Property = require("../models/Property");
const Room = require("../models/Room");
const Booking = require("../models/Booking");


// ==========================================
// GET ALL ACTIVE PROPERTIES
// ==========================================

const getProperties = async (req, res) => {
    try {
        const properties = await Property.find({
            status: "Active"
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Get properties error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching properties"
        });
    }
};


// ==========================================
// GET SINGLE PROPERTY
// ==========================================

const getPropertyById = async (req, res) => {
    try {

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        const property = await Property.findById(
            req.params.id
        );

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.status(200).json({
            success: true,
            property
        });

    } catch (error) {
        console.error("Get property error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching property"
        });
    }
};


// ==========================================
// CREATE PROPERTY - ADMIN ONLY
// ==========================================

const createProperty = async (req, res) => {
    try {
        const property = await Property.create(
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Property created successfully",
            property
        });

    } catch (error) {
        console.error(
            "Create property error:",
            error
        );

        res.status(400).json({
            success: false,
            message: "Failed to create property",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE PROPERTY - ADMIN ONLY
// ==========================================

const updateProperty = async (req, res) => {
    try {

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        const property =
            await Property.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Property updated successfully",
            property
        });

    } catch (error) {
        console.error(
            "Update property error:",
            error
        );

        res.status(400).json({
            success: false,
            message: "Failed to update property",
            error: error.message
        });
    }
};


// ==========================================
// DELETE PROPERTY - ADMIN ONLY
// ==========================================
//
// Safe deletion rules:
//
// 1. Check whether property exists.
// 2. Check whether ANY booking references it.
// 3. If bookings exist, block deletion.
// 4. If no bookings exist, delete all rooms.
// 5. Delete the property.
//
// This prevents:
//
// - Orphaned Room documents
// - Broken Booking → Property references
// - Broken Booking → Room references
//

const deleteProperty = async (req, res) => {
    try {
        const propertyId = req.params.id;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        // --------------------------------------
        // 1. Check property
        // --------------------------------------

        const property =
            await Property.findById(
                propertyId
            );

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // --------------------------------------
        // 2. Check related bookings
        // --------------------------------------

        const bookingCount =
            await Booking.countDocuments({
                property: propertyId
            });

        if (bookingCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete property because bookings exist for this property",
                bookingCount
            });
        }

        // --------------------------------------
        // 3. Delete rooms belonging
        //    to this property
        // --------------------------------------

        const roomDeleteResult =
            await Room.deleteMany({
                property: propertyId
            });

        // --------------------------------------
        // 4. Delete property
        // --------------------------------------

        await Property.findByIdAndDelete(
            propertyId
        );

        // --------------------------------------
        // 5. Success response
        // --------------------------------------

        res.status(200).json({
            success: true,
            message:
                "Property and its rooms deleted successfully",
            deletedRooms:
                roomDeleteResult.deletedCount
        });

    } catch (error) {
        console.error(
            "Delete property error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while deleting property"
        });
    }
};


// ==========================================
// GET NEARBY PROPERTIES
// ==========================================

const getNearbyProperties = async (req, res) => {
    try {
        const {
            longitude,
            latitude,
            maxDistance = 5000
        } = req.query;

        // Validate coordinates
        const lng = Number(longitude);
        const lat = Number(latitude);
        const distance = Number(maxDistance);

        if (
            Number.isNaN(lng) ||
            Number.isNaN(lat)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid longitude and latitude are required"
            });
        }

        // Validate coordinate ranges
        if (
            lng < -180 ||
            lng > 180 ||
            lat < -90 ||
            lat > 90
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid longitude or latitude values"
            });
        }

        // Validate distance
        if (
            Number.isNaN(distance) ||
            distance <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "maxDistance must be a positive number"
            });
        }

        const properties =
            await Property.find({
                status: "Active",
                "location.coordinates": {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [
                                lng,
                                lat
                            ]
                        },
                        $maxDistance: distance
                    }
                }
            });

        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error(
            "Get nearby properties error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching nearby properties"
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    getProperties,
    getPropertyById,
    getNearbyProperties,
    createProperty,
    updateProperty,
    deleteProperty
};