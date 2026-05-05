const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
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
    },
    department: {
        type: String,
        enum: ['sales', 'admin', 'mechanical', 'cleaning', 'driving', 'other'],
        required: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    employmentType: {
        type: String,
        enum: ['full_time', 'part_time', 'contract'],
        default: 'full_time',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'on_leave', 'terminated'],
        default: 'active',
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    terminationDate: {
        type: Date
    },
    baseSalary: {
        type: Number,
        required: true,
        min: 0
    },
    bankDetails: {
        bankName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        branch: { type: String, trim: true }
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Auto-generate employee ID before saving
employeeSchema.pre('save', async function (next) {
    if (!this.employeeId) {
        const count = await mongoose.model('Employee').countDocuments();
        this.employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

// Virtual: full name
employeeSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

employeeSchema.index({ status: 1 });
employeeSchema.index({ department: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
