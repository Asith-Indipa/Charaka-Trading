const { ROLES, PERMISSIONS, ROLE_PERMISSIONS: CONSTANT_MAPPING } = require('../constants/roles');
const RolePermission = require('../models/RolePermission');

// In-memory cache to avoid excessive DB hits
let permissionsCache = null;

// Helper to get effective mappings
const getEffectiveMappings = async () => {
    const dbMappings = await RolePermission.find();

    // Start with static defaults
    const mapping = {};
    Object.keys(CONSTANT_MAPPING).forEach(role => {
        mapping[role] = [...(CONSTANT_MAPPING[role] || [])];
    });

    // Union DB values with static defaults so newly added permissions
    // in constants/roles.js are always present even if the DB has a stale mapping
    dbMappings.forEach(item => {
        const staticPerms = CONSTANT_MAPPING[item.role] || [];
        const dbPerms = item.permissions || [];
        mapping[item.role] = Array.from(new Set([...staticPerms, ...dbPerms]));
    });

    return mapping;
};

// @desc    Get all role-permission mappings
// @route   GET /api/permissions
// @access  Private (Admin)
const getRolePermissions = async (req, res) => {
    try {
        const mapping = await getEffectiveMappings();

        res.status(200).json({
            success: true,
            data: {
                roles: ROLES,
                permissions: PERMISSIONS,
                mapping: mapping
            }
        });
    } catch (error) {
        console.error('Get role permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permission mappings',
            error: error.message
        });
    }
};

// @desc    Update role-permission mappings
// @route   POST /api/permissions
// @access  Private (Admin)
const updateRolePermissions = async (req, res) => {
    try {
        const { mapping } = req.body;

        if (!mapping) {
            return res.status(400).json({ success: false, message: 'Mapping data is required' });
        }

        // Save each role's permissions to DB
        const savePromises = Object.entries(mapping).map(([role, perms]) => {
            return RolePermission.findOneAndUpdate(
                { role },
                { permissions: perms },
                { upsert: true, new: true }
            );
        });

        await Promise.all(savePromises);

        res.status(200).json({
            success: true,
            message: 'Permissions updated successfully'
        });
    } catch (error) {
        console.error('Update role permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating permissions',
            error: error.message
        });
    }
};

// @desc    Get all available permission keys
// @route   GET /api/permissions/list
// @access  Private (Admin)
const getAllPermissions = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: Object.values(PERMISSIONS)
        });
    } catch (error) {
        console.error('Get all permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permissions list',
            error: error.message
        });
    }
};

module.exports = {
    getRolePermissions,
    getAllPermissions,
    updateRolePermissions,
    getEffectiveMappings // Exported for use in middleware
};
