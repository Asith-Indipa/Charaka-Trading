const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // Transaction type
    type: {
        type: String,
        enum: ['purchase', 'sale'],
        default: 'sale',
        required: true
    },

    // Transaction ID
    transactionNumber: {
        type: String,
        unique: true,
        trim: true
    },

    // Vehicle snapshot (preserves historical data)
    vehicleSnapshot: {
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true
        },
        vehicleNumber: {
            type: String,
            required: true
        },
        chassisNumber: {
            type: String,
            required: true
        },
        engineNumber: {
            type: String,
            required: true
        },
        brand: {
            type: String,
            required: true
        },
        model: {
            type: String,
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        color: String,
        mileage: Number,
        condition: String,
        price: {
            type: Number,
            required: true
        },
        description: String,
        images: [String]
    },

    // Transaction parties
    buyer: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        nic: {
            type: String,
            trim: true
        }
    },

    seller: {
        name: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        nic: {
            type: String,
            trim: true
        }
    },

    // Transaction details
    salePrice: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Payment information
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'cheque', 'finance', 'mixed'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'completed'],
        default: 'pending',
        required: true
    },
    paymentDetails: {
        transactionId: String,
        bankName: String,
        chequeNumber: String,
        financeCompany: String,
        notes: String
    },
    financeDetails: {
        financeName: String,
        vehicleTotalValue: Number,
        downPayment: Number,
        leasingValue: Number
    },

    // Transaction status
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
        required: true
    },

    // Dates
    transactionDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    completedAt: {
        type: Date
    },

    // Audit
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Additional notes
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes

transactionSchema.index({ 'vehicleSnapshot.vehicleId': 1 });
transactionSchema.index({ status: 1, transactionDate: -1 });

// Auto-generate transaction number before saving
transactionSchema.pre('save', async function (next) {
    if (!this.transactionNumber) {
        const count = await mongoose.model('Transaction').countDocuments();
        this.transactionNumber = `TXN-${Date.now()}-${count + 1}`;
    }

    // Calculate final amount if not set
    if (this.salePrice && !this.finalAmount) {
        this.finalAmount = this.salePrice - (this.discount || 0);
    }

    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
