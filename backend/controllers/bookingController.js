const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Room = require("../models/Room");


// ==========================================
// CREATE BOOKING - USER ONLY
// ==========================================

const createBooking = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const {
            propertyId,
            roomId,
            occupants,
            checkIn,
            checkOut,
            paymentMethod,
            specialRequests
        } = req.body;

        // Validate required fields
        if (
            !propertyId ||
            !roomId ||
            !occupants ||
            !checkIn
        ) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Property, room, occupants and check-in date are required"
            });
        }

        // Validate property ObjectId
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Invalid property ID"
            });
        }

        // Validate room ObjectId
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        // Validate occupants
        if (
            !Number.isInteger(occupants) ||
            occupants < 1
        ) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Occupants must be at least 1"
            });
        }

        // Find property
        const property = await Property.findById(
            propertyId
        ).session(session);

        if (!property) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        if (property.status !== "Active") {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Property is not active"
            });
        }

        // Validate check-in date
        const checkInDate = new Date(checkIn);

        if (Number.isNaN(checkInDate.getTime())) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Invalid check-in date"
            });
        }

        // Validate check-out date
        let checkOutDate;

        if (checkOut) {
            checkOutDate = new Date(checkOut);

            if (Number.isNaN(checkOutDate.getTime())) {
                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: "Invalid check-out date"
                });
            }

            if (checkOutDate <= checkInDate) {
                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message:
                        "Check-out date must be after check-in date"
                });
            }
        }

        // Find room
        const room = await Room.findById(
            roomId
        ).session(session);

        if (!room) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        // Make sure room belongs to selected property
        if (
            room.property.toString() !==
            property._id.toString()
        ) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Room does not belong to this property"
            });
        }

        // Validate capacity
        if (occupants > room.capacity) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Number of occupants exceeds room capacity"
            });
        }

        // ------------------------------------------
        // ATOMIC BED RESERVATION
        // ------------------------------------------
        //
        // The database itself checks that enough
        // beds are still available while updating.
        //
        // This prevents two simultaneous requests
        // from consuming the same final bed.
        //

        const updatedRoom =
            await Room.findOneAndUpdate(
                {
                    _id: room._id,
                    status: "Available",
                    availableBeds: {
                        $gte: occupants
                    }
                },
                {
                    $inc: {
                        availableBeds: -occupants
                    }
                },
                {
                    new: true,
                    session
                }
            );

        if (!updatedRoom) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message:
                    "Not enough beds available or room is no longer available"
            });
        }

        // If no beds remain, mark room Full
        if (updatedRoom.availableBeds === 0) {
            updatedRoom.status = "Full";

            await updatedRoom.save({
                session
            });
        }

        // Generate booking ID
        const bookingId =
            `BK-${Date.now()}-${Math.floor(
                Math.random() * 1000
            )}`;

        // Calculate amount from database values
        const monthlyRent = updatedRoom.rent;
        const deposit = property.deposit;

        const totalAmount =
            monthlyRent + deposit;

        // Create booking inside same transaction
        const booking =
            await Booking.create(
                [
                    {
                        bookingId,
                        user: req.user.userId,
                        property: property._id,
                        room: updatedRoom._id,
                        occupants,
                        checkIn: checkInDate,
                        checkOut: checkOutDate,
                        monthlyRent,
                        deposit,
                        totalAmount,
                        paymentMethod:
                            paymentMethod || "Online",
                        specialRequests
                    }
                ],
                {
                    session
                }
            );

        // Commit everything
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message:
                "Booking created successfully",
            booking: booking[0]
        });

    } catch (error) {
        await session.abortTransaction();

        console.error(
            "Create booking error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while creating booking"
        });

    } finally {
        session.endSession();
    }
};


// ==========================================
// GET CURRENT USER'S BOOKINGS
// ==========================================

const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            user: req.user.userId
        })
            .populate("property", "name location")
            .populate("room", "roomNumber roomType rent")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error("Get my bookings error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching bookings"
        });
    }
};


// ==========================================
// GET SINGLE BOOKING - CURRENT USER
// ==========================================

const getBookingById = async (req, res) => {
    try {

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.userId
        })
            .populate("property", "name location")
            .populate("room", "roomNumber roomType rent");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error("Get booking error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching booking"
        });
    }
};


// ==========================================
// GET ALL BOOKINGS - ADMIN ONLY
// ==========================================

const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "name email mobile")
            .populate("property", "name location")
            .populate("room", "roomNumber roomType rent")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error("Get all bookings error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching all bookings"
        });
    }
};


// ==========================================
// GET SINGLE BOOKING - ADMIN ONLY
// ==========================================

const getAdminBookingById = async (req, res) => {
    try {

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await Booking.findById(req.params.id)
            .populate("user", "name email mobile")
            .populate("property", "name location")
            .populate("room", "roomNumber roomType rent");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error("Get admin booking error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching booking"
        });
    }
};


// ==========================================
// UPDATE BOOKING STATUS - ADMIN ONLY
// ==========================================

const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Validate booking ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const allowedStatuses = [
            "Requested",
            "Confirmed",
            "Completed",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking status"
            });
        }

        const booking = await Booking.findById(
            req.params.id
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Define valid booking status transitions
        const allowedTransitions = {
            Requested: [
                "Confirmed",
                "Cancelled"
            ],
            Confirmed: [
                "Completed",
                "Cancelled"
            ],
            Completed: [],
            Cancelled: []
        };

        if (
            !allowedTransitions[booking.status].includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot change booking status from ${booking.status} to ${status}`
            });
        }

        // --------------------------------------
        // Admin cancellation
        // Restore room beds when a confirmed
        // booking is cancelled by admin.
        // --------------------------------------

        if (
            booking.status === "Confirmed" &&
            status === "Cancelled"
        ) {
            const room = await Room.findById(
                booking.room
            );

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: "Associated room not found"
                });
            }

            // Restore occupied beds
            room.availableBeds += booking.occupants;

            // Prevent beds from exceeding capacity
            if (
                room.availableBeds >
                room.capacity
            ) {
                room.availableBeds =
                    room.capacity;
            }

            // If at least one bed is available,
            // room becomes available again.
            if (room.availableBeds > 0) {
                room.status = "Available";
            }

            await room.save();
        }

        // Update booking status
        booking.status = status;

        await booking.save();

        res.status(200).json({
            success: true,
            message:
                "Booking status updated successfully",
            booking
        });

    } catch (error) {
        console.error(
            "Update booking status error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while updating booking status"
        });
    }
};


// ==========================================
// CANCEL BOOKING - CURRENT USER ONLY
// ==========================================

const cancelBooking = async (req, res) => {
    try {

        // Validate booking ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Only requested or confirmed bookings can be cancelled
        if (
            booking.status !== "Requested" &&
            booking.status !== "Confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Booking cannot be cancelled"
            });
        }

        const room = await Room.findById(
            booking.room
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Associated room not found"
            });
        }

        // Restore available beds
        room.availableBeds += booking.occupants;

        // Prevent available beds from exceeding capacity
        if (
            room.availableBeds >
            room.capacity
        ) {
            room.availableBeds =
                room.capacity;
        }

        if (room.availableBeds > 0) {
            room.status = "Available";
        }

        await room.save();

        booking.status = "Cancelled";

        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking
        });

    } catch (error) {
        console.error("Cancel booking error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while cancelling booking"
        });
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getAllBookings,
    getAdminBookingById,
    updateBookingStatus
};