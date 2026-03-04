const mongoose = require('mongoose');

const StoreInfoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Store name is required'],
        default: 'Charaka Trading'
    },
    phone: {
        type: String,
        default: '0771234567'
    },
    email: {
        type: String,
        default: 'info@charakatrading.com'
    },
    address: {
        type: String,
        default: 'No. 123, Main Road, Kiribathgoda'
    },
    registrationNumber: {
        type: String,
        default: ''
    },
    taxID: {
        type: String,
        default: ''
    },
    logo: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('StoreInfo', StoreInfoSchema);
