const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'vehicleModel'
    },
    vehicleModel: {
        type: String,
        required: true,
        enum: ['Vehicle', 'NewVehicle'],
        default: 'Vehicle'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentSlip: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    },
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
