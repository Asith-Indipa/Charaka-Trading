const express = require('express');
const router = express.Router();
const { getDashboardStats, getDetailedAnalytics } = require('../controllers/statsController');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');

// Protect all routes
router.use(authenticateToken);
router.use(checkPermission(PERMISSIONS.ANALYTICS_VIEW));

router.get('/', getDashboardStats);
router.get('/analytics', getDetailedAnalytics);

module.exports = router;
