const express = require('express');
const router = express.Router();
const {
    createTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    getVehicleTransactionHistory
} = require('../controllers/transactionController');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');
const { validateTransaction } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Transaction routes
router.post('/', checkPermission(PERMISSIONS.TRANSACTION_CREATE), validateTransaction, createTransaction);
router.get('/', checkPermission(PERMISSIONS.TRANSACTION_VIEW), getTransactions);
router.get('/:id', checkPermission(PERMISSIONS.TRANSACTION_VIEW), getTransaction);
router.patch('/:id', checkPermission(PERMISSIONS.TRANSACTION_EDIT), updateTransaction);
router.get('/vehicle/:vehicleId', checkPermission(PERMISSIONS.TRANSACTION_VIEW), getVehicleTransactionHistory);

module.exports = router;
