const express = require('express');
const router = express.Router();
const { PERMISSIONS } = require('../constants/roles');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getSalaryRecords,
    getSalarySummary,
    createSalaryRecord,
    updateSalaryRecord
} = require('../controllers/employeeController');

// Salary summary (must be before /:id routes to avoid conflict)
router.get(
    '/salary/summary',
    authenticateToken,
    checkPermission(PERMISSIONS.ANALYTICS_VIEW),
    getSalarySummary
);

// Employee CRUD
router.get('/', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_VIEW), getEmployees);
router.get('/:id', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_VIEW), getEmployee);
router.post('/', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_CREATE), createEmployee);
router.patch('/:id', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_EDIT), updateEmployee);
router.delete('/:id', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_DELETE), deleteEmployee);

// Salary records per employee
router.get('/:id/salary', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_VIEW), getSalaryRecords);
router.post('/:id/salary', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_SALARY_MANAGE), createSalaryRecord);
router.patch('/:id/salary/:sid', authenticateToken, checkPermission(PERMISSIONS.EMPLOYEE_SALARY_MANAGE), updateSalaryRecord);

module.exports = router;
