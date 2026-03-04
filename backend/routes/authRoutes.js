const express = require('express');
const router = express.Router();
const { register, login, getMe, getUsers, createUser, updateUser, deleteUser } = require('../controllers/authController');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/roles');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

// Validation rules
const registerValidation = [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', authenticateToken, getMe);

// Admin/Moderator routes
router.get('/users', authenticateToken, checkPermission(PERMISSIONS.USER_VIEW), getUsers);

// Admin only routes
router.post('/users', authenticateToken, checkPermission(PERMISSIONS.USER_CREATE), createUser);
router.patch('/users/:id', authenticateToken, checkPermission(PERMISSIONS.USER_EDIT), updateUser);
router.delete('/users/:id', authenticateToken, checkPermission(PERMISSIONS.USER_DELETE), deleteUser);

module.exports = router;
