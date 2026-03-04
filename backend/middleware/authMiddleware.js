const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES, ROLE_PERMISSIONS } = require('../constants/roles');

// Protect routes - verify JWT token
const authenticateToken = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User account is not active'
                });
            }

            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

// Authorize specific roles (Maintained for backward compatibility or simple role checks)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} is not authorized to access this resource`
            });
        }

        next();
    };
};

/**
 * Middleware to check if user has a specific permission
 */
const checkPermission = (permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Importing here to avoid circular dependencies and get the latest dynamic mapping
        const { getEffectiveMappings } = require('../controllers/permissionController');
        const mapping = await getEffectiveMappings();
        const userPermissions = mapping[req.user.role] || [];

        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    checkPermission
};
