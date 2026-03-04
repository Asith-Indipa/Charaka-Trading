const express = require('express');
const router = express.Router();
const { getRolePermissions, getAllPermissions, updateRolePermissions } = require('../controllers/permissionController');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

// Protect all routes - Only Admins should see the mapping
router.use(authenticateToken);
router.use(checkPermission(PERMISSIONS.USER_VIEW)); // Using USER_VIEW as a proxy for administrative overhead, or could add a specific one

router.get('/', getRolePermissions);
router.post('/', updateRolePermissions);
router.get('/list', getAllPermissions);

module.exports = router;
