const express = require('express');
const router = express.Router();
const {
    getVehicles,
    getVehicle,
    addNewVehicle,
    relistVehicle,
    addFromTransaction,
    updateVehicle,
    archiveVehicle
} = require('../controllers/vehicleController');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');
const {
    validateNewVehicle,
    validateRelistVehicle,
    validateFromTransaction
} = require('../middleware/validationMiddleware');
const upload = require('../utils/imageUpload');

// Public routes
router.get('/', getVehicles);

// Handle this specifically to avoid CastError with /:id
router.get('/new', (req, res) => res.status(404).json({ message: 'Not found' }));

router.get('/:id', getVehicle);

// Protected routes
router.post(
    '/new',
    authenticateToken,
    checkPermission(PERMISSIONS.VEHICLE_CREATE),
    upload.array('images', 10),
    validateNewVehicle,
    addNewVehicle
);

router.post(
    '/:id/relist',
    authenticateToken,
    checkPermission(PERMISSIONS.VEHICLE_RELIST),
    upload.array('images', 10),
    validateRelistVehicle,
    relistVehicle
);

router.post(
    '/from-transaction/:transactionId',
    authenticateToken,
    checkPermission(PERMISSIONS.VEHICLE_RELIST),
    upload.array('images', 10),
    validateFromTransaction,
    addFromTransaction
);

router.patch(
    '/:id',
    authenticateToken,
    checkPermission(PERMISSIONS.VEHICLE_EDIT),
    upload.array('images', 10),
    updateVehicle
);

router.delete(
    '/:id',
    authenticateToken,
    checkPermission(PERMISSIONS.VEHICLE_DELETE),
    archiveVehicle
);

module.exports = router;
