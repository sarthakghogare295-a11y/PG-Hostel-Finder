const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        propertyType: {
            type: String,
            enum: ["PG", "Hostel"],
            required: true
        },

        location: {
            address: {
                type: String,
                required: true,
                trim: true
            },

            city: {
                type: String,
                required: true,
                trim: true
            },

            state: {
                type: String,
                required: true,
                trim: true
            },

            coordinates: {
                type: {
                    type: String,
                    enum: ["Point"],
                    default: "Point"
                },

                coordinates: {
                    type: [Number],
                    required: true
                }
            }
        },

        rentFrom: {
            type: Number,
            required: true,
            min: 0
        },

        deposit: {
            type: Number,
            required: true,
            min: 0
        },

        facilities: {
            type: [String],
            default: []
        },

        images: {
            type: [String],
            default: []
        },

        rules: {
            type: [String],
            default: []
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Any"],
            required: true
        },

        contact: {
            phone: {
                type: String,
                trim: true
            },

            email: {
                type: String,
                trim: true,
                lowercase: true
            }
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        }
    },
    {
        timestamps: true
    }
);

// Geospatial index for "Find PGs Near Me"
propertySchema.index({
    "location.coordinates": "2dsphere"
});

module.exports = mongoose.model("Property", propertySchema);