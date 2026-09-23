const mongoose = require("mongoose");
const Favorite = require("../models/Favorite");
const Property = require("../models/Property");

// Add property to favorites
const addFavorite = async (req, res) => {
    try {
        const { propertyId } = req.body;

        if (!propertyId) {
            return res.status(400).json({
                success: false,
                message: "Property ID is required"
            });
        }

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

        // Only active properties can be favorited
        if (property.status !== "Active") {
            return res.status(400).json({
                success: false,
                message: "Property is not active"
            });
        }

        // Check whether already favorited
        const existingFavorite = await Favorite.findOne({
            user: req.user.userId,
            property: propertyId
        });

        if (existingFavorite) {
            return res.status(409).json({
                success: false,
                message: "Property is already in favorites"
            });
        }

        const favorite = await Favorite.create({
            user: req.user.userId,
            property: propertyId
        });

        res.status(201).json({
            success: true,
            message: "Property added to favorites",
            favorite
        });

    } catch (error) {
        console.error("Add favorite error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding favorite"
        });
    }
};


// Get current user's favorites
const getMyFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find({
            user: req.user.userId
        })
            .populate(
                "property",
                "name description propertyType location rentFrom deposit facilities images gender status"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: favorites.length,
            favorites
        });

    } catch (error) {
        console.error("Get favorites error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching favorites"
        });
    }
};


// Remove property from favorites
const removeFavorite = async (req, res) => {
    try {
        const { propertyId } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        const favorite = await Favorite.findOneAndDelete({
            user: req.user.userId,
            property: propertyId
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: "Property is not in favorites"
            });
        }

        res.status(200).json({
            success: true,
            message: "Property removed from favorites"
        });

    } catch (error) {
        console.error("Remove favorite error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while removing favorite"
        });
    }
};


module.exports = {
    addFavorite,
    getMyFavorites,
    removeFavorite
};