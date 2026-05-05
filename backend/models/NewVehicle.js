const mongoose = require('mongoose');

const newVehicleSchema = new mongoose.Schema({
    // Lifecycle management
    status: {
        type: String,
        enum: ['available', 'booked', 'sold', 'archived', 'relisted'],
        default: 'available',
        required: true
    },
    // Vehicle specifications
    brand: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1
    },
    color: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['car', 'three-wheel', 'motorbike'],
        default: 'car',
        required: true
    },
    engineCapacity: {
        type: String,
        trim: true
    },
    bikeType: {
        enum: ['sport', 'cruiser', 'scooter', 'commuter'],
        type: String,
        trim: true
    },

    // Pricing
    price: {
        type: Number,
        required: true,
        min: 0
    },

    // Description and media
    description: {
        type: String,
        trim: true
    },
    images: [{
        type: String // URLs or file paths
    }],

    // Additional specifications
    fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'none'],
        default: 'none',
        trim: true
    },
    transmission: {
        type: String,
        enum: ['manual', 'automatic', 'semi-automatic', 'cvt', 'none'],
        default: 'none',
        trim: true
    },
    bodyType: {
        type: String,
        enum: ['sedan', 'hatchback', 'coupe', 'convertible', 'wagon', 'suv', 'van', 'pickup', 'none'],
        default: 'none',
        trim: true
    },
    seatingCapacity: {
        type: Number,
        min: 1
    },


    // Audit fields
    listedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listedAt: {
        type: Date,
        default: Date.now
    },
    soldAt: {
        type: Date
    },

    // Metadata
    isActive: {
        type: Boolean,
        default: true
    },
    bookingPercentage: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
newVehicleSchema.index({ status: 1, condition: 1 });
newVehicleSchema.index({ brand: 1, model: 1 });



// Virtual for listing ID
newVehicleSchema.virtual('listingId').get(function () {
    return `VL-${this._id}`;
});

// Ensure virtuals are included in JSON
newVehicleSchema.set('toJSON', { virtuals: true });
newVehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('NewVehicle', newVehicleSchema);
