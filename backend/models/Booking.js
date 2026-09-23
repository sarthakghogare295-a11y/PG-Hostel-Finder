const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },

        occupants: {
            type: Number,
            required: true,
            min: 1
        },

        checkIn: {
            type: Date,
            required: true
        },

        checkOut: {
            type: Date
        },

        monthlyRent: {
            type: Number,
            required: true,
            min: 0
        },

        deposit: {
            type: Number,
            required: true,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Card", "Online"],
            default: "Online"
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        },

        status: {
            type: String,
            enum: ["Requested", "Confirmed", "Completed", "Cancelled"],
            default: "Requested"
        },

        specialRequests: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Booking", bookingSchema);