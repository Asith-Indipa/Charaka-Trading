
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/axios';
import { ROLES, hasPermission } from '@/utils/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dynamicPermissions, setDynamicPermissions] = useState(null);

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/permissions');
            if (res.data.success) {
                setDynamicPermissions(res.data.data.mapping);
            }
        } catch (error) {
            console.error("Failed to fetch dynamic permissions", error);
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
        if (!user || !user.role || !dynamicPermissions) return false;
        const permissions = dynamicPermissions[user.role] || [];
        return permissions.includes(permission);
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === ROLES.ADMIN || user?.role === ROLES.MODERATOR,
        can,
        refreshPermissions: fetchPermissions // Expose this so Permissions.jsx can trigger it if needed
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
