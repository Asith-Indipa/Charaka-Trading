const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const NewVehicle = require('../models/NewVehicle');
const path = require('path');

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const { vehicleId, notes } = req.body;

        if (!vehicleId) {
            return res.status(400).json({ message: 'Please provide vehicle ID' });
        }

        let vehicle = await Vehicle.findById(vehicleId);
        let vehicleModel = 'Vehicle';

        if (!vehicle) {
            vehicle = await NewVehicle.findById(vehicleId);
            vehicleModel = 'NewVehicle';
        }

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.status === 'sold' || vehicle.status === 'booked') {
            return res.status(400).json({ message: 'This vehicle is no longer available for booking' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a payment slip' });
        }

        // Store relative path for static serving
        const slipUrl = `/uploads/vehicles/${req.file.filename}`;

        const booking = await Booking.create({
            vehicle: vehicleId,
            vehicleModel,
            user: req.user.id,
            paymentSlip: slipUrl,
            notes
        });

        res.status(201).json({
            message: 'Booking request submitted successfully. We will contact you soon.',
            data: booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('vehicle', 'brand model year vehicleNumber price condition status')
            .populate('user', 'firstName lastName email phone')
            .populate('handledBy', 'email')
            .sort({ createdAt: -1 });

        res.status(200).json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get user's own bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('vehicle', 'brand model year vehicleNumber price condition status images')
            .sort({ createdAt: -1 });

        res.status(200).json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Update booking status (Approve/Reject)
// @route   PATCH /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        booking.handledBy = req.user.id;
        await booking.save();

        // If approved, update vehicle status to booked
        if (status === 'approved') {
            if (booking.vehicleModel === 'NewVehicle') {
                await NewVehicle.findByIdAndUpdate(booking.vehicle, { status: 'booked' });
            } else {
                await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'booked' });
            }
            
            // Optionally, we could reject all other pending bookings for this vehicle
            await Booking.updateMany(
                { vehicle: booking.vehicle, _id: { $ne: booking._id }, status: 'pending' },
                { status: 'rejected', handledBy: req.user.id }
            );
        } else if (status === 'rejected') {
            let vehicle;
            if (booking.vehicleModel === 'NewVehicle') {
                vehicle = await NewVehicle.findById(booking.vehicle);
            } else {
                vehicle = await Vehicle.findById(booking.vehicle);
            }
            
            if (vehicle && vehicle.status === 'booked') {
                vehicle.status = 'available';
                await vehicle.save();
            }
        }

        const updatedBooking = await Booking.findById(bookingId)
            .populate('vehicle', 'brand model year vehicleNumber price condition')
            .populate('handledBy', 'email');

        res.status(200).json({
            message: `Booking marked as ${status}`,
            data: updatedBooking
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getMyBookings,
    updateBookingStatus
};
