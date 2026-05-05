//this page you can see when click on login or register button, it will show the form to login or register, and after login or register successfully, it will redirect to home page, and you can see the user info in the header, and you can click on logout button to logout, and after logout, it will redirect to home page again


import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/axios';
import { ROLES, ROLE_PERMISSIONS } from '@/utils/roles';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dynamicPermissions, setDynamicPermissions] = useState(null);

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/permissions');
            if (res.data.success) {
                // Merge: start with static defaults, then overlay DB values.
                // This ensures newly added permissions in constants are always visible
                // even if the DB has a stale/incomplete mapping for a role.
                const dbMapping = res.data.data.mapping;
                const merged = {};
                Object.keys(ROLE_PERMISSIONS).forEach(role => {
                    const staticPerms = ROLE_PERMISSIONS[role] || [];
                    const dbPerms = dbMapping[role] || [];
                    // Union of both sets so neither source loses permissions
                    merged[role] = Array.from(new Set([...staticPerms, ...dbPerms]));
                });
                setDynamicPermissions(merged);
            }
        } catch (error) {
            console.error("Failed to fetch dynamic permissions", error);
            // Fall back to static permissions so the app stays usable offline
            setDynamicPermissions(ROLE_PERMISSIONS);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    if (res.data.success) {
                        setUser(res.data.data);
                        await fetchPermissions();
                    } else {
                        localStorage.removeItem('token');
                    }
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
            localStorage.setItem('token', res.data.data.token);
            setUser(res.data.data);
            await fetchPermissions();
        }
        return res.data;
    };

    const register = async (userData) => {
        const res = await api.post('/auth/register', userData);
        if (res.data.success) {
            localStorage.setItem('token', res.data.data.token);
            setUser(res.data.data);
            await fetchPermissions();
        }
        return res.data;
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setDynamicPermissions(null);
    };

    const can = (permission) => {
        if (!user || !user.role) return false;
        // Use dynamic (merged) permissions if available, otherwise fall back to static defaults
        const effectivePermissions = dynamicPermissions ?? ROLE_PERMISSIONS;
        const permissions = effectivePermissions[user.role] || [];
        return permissions.includes(permission);
    };

    const value = {
        user,
        setUser,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === ROLES.ADMIN || user?.role === ROLES.MODERATOR,
        can,
        refreshPermissions: fetchPermissions
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
// Re-export useAuth here so all existing imports from '@/context/AuthContext' still work
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
