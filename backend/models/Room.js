const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },

        roomNumber: {
            type: String,
            required: true,
            trim: true
        },

        roomType: {
            type: String,
            enum: ["Single", "Double", "Triple", "Four Sharing"],
            required: true
        },

        rent: {
            type: Number,
            required: true,
            min: 0
        },

   capacity: {
    type: Number,
    required: true,
    min: 1
},

availableBeds: {
    type: Number,
    required: true,
    min: 0,
    validate: {
        validator: function (value) {
            return value <= this.capacity;
        },
        message: "Available beds cannot be greater than room capacity"
    }
},

        facilities: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["Available", "Full", "Maintenance"],
            default: "Available"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Room", roomSchema);