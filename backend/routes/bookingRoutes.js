const express = require('express');
const router = express.Router();
const {
    createBooking,
    getBookings,
    getMyBookings,
    updateBookingStatus
} = require('../controllers/bookingController');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');
const upload = require('../utils/imageUpload');

// Protected route to create a booking (with payment slip upload)
router.post('/', authenticateToken, upload.single('paymentSlip'), createBooking);

// Protected route for users to see their own bookings
router.get('/my', authenticateToken, getMyBookings);

// Protected admin routes
router.get('/', authenticateToken, checkPermission(PERMISSIONS.VEHICLE_EDIT), getBookings);
router.patch('/:id/status', authenticateToken, checkPermission(PERMISSIONS.VEHICLE_EDIT), updateBookingStatus);

module.exports = router;
