const mongoose = require('mongoose');

const salaryRecordSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true,
        min: 2000
    },
    baseSalary: {
        type: Number,
        required: true,
        min: 0
    },
    allowances: {
        type: Number,
        default: 0,
        min: 0
    },
    bonuses: {
        type: Number,
        default: 0,
        min: 0
    },
    deductions: {
        type: Number,
        default: 0,
        min: 0
    },
    netSalary: {
        type: Number,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
        required: true
    },
    paymentDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'cheque', ''],
        default: ''
    },
    notes: {
        type: String,
        trim: true
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Unique per employee per month per year
salaryRecordSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Auto-calculate netSalary before saving
salaryRecordSchema.pre('save', function (next) {
    this.netSalary = (this.baseSalary || 0) + (this.allowances || 0) + (this.bonuses || 0) - (this.deductions || 0);
    if (this.netSalary < 0) this.netSalary = 0;
    next();
});

// Auto-calculate on findOneAndUpdate too
salaryRecordSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.$set) {
        const base = update.$set.baseSalary;
        const allowances = update.$set.allowances || 0;
        const bonuses = update.$set.bonuses || 0;
        const deductions = update.$set.deductions || 0;
        if (base !== undefined) {
            update.$set.netSalary = Math.max(0, base + allowances + bonuses - deductions);
        }
    }
    next();
});

module.exports = mongoose.model('SalaryRecord', salaryRecordSchema);
