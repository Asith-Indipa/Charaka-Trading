const ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user'
};

const PERMISSIONS = {
    // Vehicles
    VEHICLE_VIEW: 'vehicle_view',
    VEHICLE_CREATE: 'vehicle_create',
    VEHICLE_EDIT: 'vehicle_edit',
    // VEHICLE_RELIST: 'vehicle_relist',
    VEHICLE_DELETE: 'vehicle_delete',

    // Transactions
    TRANSACTION_VIEW: 'transaction_view',
    TRANSACTION_CREATE: 'transaction_create',
    TRANSACTION_EDIT: 'transaction_edit',

    // Store Settings
    STORE_VIEW: 'store_view',
    STORE_EDIT: 'store_edit',

    // Users
    USER_VIEW: 'user_view',
    USER_CREATE: 'user_create',
    USER_EDIT: 'user_edit',
    USER_DELETE: 'user_delete',

    // Analytics
    ANALYTICS_VIEW: 'analytics_view',

    // Employees
    EMPLOYEE_VIEW: 'employee_view',
    EMPLOYEE_CREATE: 'employee_create',
    EMPLOYEE_EDIT: 'employee_edit',
    EMPLOYEE_DELETE: 'employee_delete',
    EMPLOYEE_SALARY_MANAGE: 'employee_salary_manage'
};

const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MODERATOR]: [
        PERMISSIONS.VEHICLE_VIEW,
        PERMISSIONS.VEHICLE_CREATE,
        PERMISSIONS.VEHICLE_EDIT,
        PERMISSIONS.TRANSACTION_VIEW,
        PERMISSIONS.TRANSACTION_CREATE,
        PERMISSIONS.TRANSACTION_EDIT,
        PERMISSIONS.STORE_VIEW,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.EMPLOYEE_VIEW,
        PERMISSIONS.EMPLOYEE_CREATE,
        PERMISSIONS.EMPLOYEE_EDIT,
        PERMISSIONS.EMPLOYEE_SALARY_MANAGE
    ],
    [ROLES.USER]: [
        PERMISSIONS.VEHICLE_VIEW
    ]
};

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS
};
