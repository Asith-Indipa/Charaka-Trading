const RolePermission = require('../models/RolePermission');
const { ROLE_PERMISSIONS } = require('../constants/roles');

/**
 * Seed (or sync) role-permission mappings into the database.
 *
 * For each role defined in ROLE_PERMISSIONS (constants/roles.js):
 *   - If a document already exists in the DB for that role, merge the
 *     static permissions with the DB permissions (union) and save.
 *   - If no document exists, create one with the static permissions.
 *
 * This ensures that:
 *   1. New permissions added to roles.js are automatically picked up.
 *   2. Custom permissions added via the admin UI are preserved.
 */
const seedPermissions = async () => {
    try {
        for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
            const existing = await RolePermission.findOne({ role });

            if (existing) {
                // Merge: keep any extra permissions from the DB, add new ones from constants
                const merged = Array.from(new Set([...existing.permissions, ...permissions]));
                existing.permissions = merged;
                await existing.save();
                //console.log(`  ✔ Role "${role}" permissions synced (${merged.length} permissions)`);
            } else {
                await RolePermission.create({ role, permissions });
                //console.log(`  ✔ Role "${role}" created with ${permissions.length} permissions`);
            }
        }

        //console.log('Role permissions seeded to DB successfully');
    } catch (error) {
        console.error('Error seeding role permissions:', error.message);
    }
};

module.exports = seedPermissions;
