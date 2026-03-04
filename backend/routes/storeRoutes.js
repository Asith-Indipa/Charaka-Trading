const express = require('express');
const router = express.Router();
const { getStoreInfo, updateStoreInfo } = require('../controllers/storeController');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

router.get('/', getStoreInfo);
router.put('/', authenticateToken, checkPermission(PERMISSIONS.STORE_EDIT), updateStoreInfo);

module.exports = router;
