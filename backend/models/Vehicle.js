const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    // Unique identifiers
    vehicleNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    chassisNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    engineNumber: {
        type: String,
        required: true,
        trim: true
    },

    // Lifecycle management
    status: {
        type: String,
        enum: ['available', 'sold', 'archived', 'relisted'],
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
    mileage: {
        type: Number,
        min: 0
    },
    condition: {
        type: String,
        enum: ['new', 'used'],
        required: true,
        default: 'used'
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
        trim: true,
        default: 'commuter'
    },

    // Pricing
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    purchaseCost: {
        type: Number,
        min: 0,
        default: 0
    },
    profitMarginType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    profitMarginValue: {
        type: Number,
        min: 0,
        default: 0
    },
    calculatedProfit: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ['none', 'percentage', 'fixed'],
        default: 'none'
    },
    discountValue: {
        type: Number,
        min: 0,
        default: 0
    },
    discountedPrice: {
        type: Number,
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
        enum: ['sedan', 'hatchback', 'coupe', 'convertible', 'wagon', 'SUV', 'van', 'pickup', 'none'],
        default: 'none',
        trim: true
    },
    seatingCapacity: {
        type: Number,
        min: 1
    },

    // Re-listing reference
    originalVehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        default: null
    },
    relistCount: {
        type: Number,
        default: 0
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
    }
}, {
    timestamps: true
});

// Indexes for faster queries
vehicleSchema.index({ status: 1, condition: 1 });
vehicleSchema.index({ brand: 1, model: 1 });



// Virtual for listing ID
vehicleSchema.virtual('listingId').get(function () {
    return `VL-${this._id}`;
});

// Ensure virtuals are included in JSON
vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
