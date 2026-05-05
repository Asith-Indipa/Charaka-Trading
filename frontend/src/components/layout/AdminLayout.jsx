//this is the admin sidebar component

import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/utils/roles';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard, TrendingUp, Receipt, Users, UserCog,
    DollarSign, Store, Shield, ChevronLeft, ChevronRight,
    PlusCircle, List, Menu, X, LogOut, Settings, User, Sun, Moon, CalendarCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

const NAV_GROUPS = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard', permission: PERMISSIONS.ANALYTICS_VIEW },
            { label: 'Analytics', icon: TrendingUp, to: '/admin/analytics', permission: PERMISSIONS.ANALYTICS_VIEW },
        ],
    },
    {
        label: 'Inventory',
        items: [
            { label: 'All Vehicles', icon: List, to: '/admin/vehicles', permission: PERMISSIONS.VEHICLE_VIEW },
            { label: 'Add Vehicle', icon: PlusCircle, to: '/admin/vehicles/new', permission: PERMISSIONS.VEHICLE_CREATE },
            { label: 'Bookings', icon: CalendarCheck, to: '/admin/bookings', permission: PERMISSIONS.VEHICLE_EDIT },
        ],
    },
    {
        label: 'Sales',
        items: [
            { label: 'Transactions', icon: Receipt, to: '/admin/transactions', permission: PERMISSIONS.TRANSACTION_VIEW },
            { label: 'New Transaction', icon: PlusCircle, to: '/admin/transactions/new', permission: PERMISSIONS.TRANSACTION_CREATE },
        ],
    },
    // {
    //     label: 'HR & Payroll',
    //     items: [
    //         { label: 'Employees',         icon: Users,       to: '/admin/employees', permission: PERMISSIONS.EMPLOYEE_VIEW },
    //         { label: 'Salary Management', icon: DollarSign,  to: '/admin/salary',    permission: PERMISSIONS.EMPLOYEE_SALARY_MANAGE },
    //     ],
    // },
    {
        label: 'Administration',
        items: [
            { label: 'User Accounts', icon: UserCog, to: '/admin/users', permission: PERMISSIONS.USER_VIEW },
            { label: 'Store Settings', icon: Store, to: '/admin/settings?tab=store', permission: PERMISSIONS.STORE_EDIT },
            { label: 'Permissions', icon: Shield, to: '/admin/settings?tab=permissions', permission: PERMISSIONS.USER_CREATE },
        ],
    },
    {
        label: 'Account',
        items: [
            { label: 'Settings', icon: Settings, to: '/admin/settings' },
            { label: 'Profile', icon: User, to: '/admin/profile' },
        ],
    },
];

const ALL_NAV_PATHS = NAV_GROUPS.flatMap(group => group.items.map(item => item.to.split('?')[0]));

function NavItem({ item, collapsed, onClick }) {
    const location = useLocation();

    // Match path ignoring query string; for exact root links use exact match
    const itemPath = item.to.split('?')[0];
    const itemSearch = item.to.includes('?') ? `?${item.to.split('?')[1]}` : null;

    let isActive = false;
    if (itemSearch) {
        // Query-string links: match both path and search
        isActive = location.pathname === itemPath && location.search.includes(itemSearch.replace('?', ''));
    } else {
        // For /admin/settings (no query) — only exact match to avoid collision with ?tab= links
        const isParent = item.to === '/admin/settings' || item.to === '/admin/profile';

        const isExactMatch = location.pathname === itemPath;
        const isPrefixMatch = itemPath !== '/admin/dashboard' && location.pathname.startsWith(itemPath + '/');

        // If it's a prefix match, ensure we aren't exactly matching another specialized nav item
        // e.g., if on /admin/vehicles/new, "All Vehicles" (/admin/vehicles) shouldn't be active
        const matchesOtherItemExactly = ALL_NAV_PATHS.some(p => p !== itemPath && location.pathname === p);

        isActive = isParent
            ? isExactMatch && !location.search
            : isExactMatch || (isPrefixMatch && !matchesOtherItemExactly);
    }

    return (
        <Link
            to={item.to}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
        >
            <item.icon className={cn(
                'h-4 w-4 shrink-0',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
            )} />
            {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
    );
}

function Sidebar({ collapsed, setCollapsed, onClose, isMobile }) {
    const { user, logout, can } = useAuth();
    const { isDark, toggle: toggleTheme } = useTheme();

    const visibleGroups = NAV_GROUPS.map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || can(item.permission)),
    })).filter(group => group.items.length > 0);

    return (
        <aside className={cn(
            'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
            collapsed ? 'w-[60px]' : 'w-[240px]'
        )}>
            {/* Logo / Header */}
            <div className={cn(
                'flex items-center border-b border-sidebar-border shrink-0 h-16',
                collapsed ? 'justify-center px-2' : 'justify-between px-4'
            )}>
                {!collapsed && (
                    <Link to="/" className="flex items-center gap-2 font-bold text-primary">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">CT</span>
                        <span className="text-sm">Charaka Trading</span>
                    </Link>
                )}
                {collapsed && (
                    <Link to="/" className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                        CT
                    </Link>
                )}
                {isMobile ? (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                ) : (
                    !collapsed && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setCollapsed(true)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )
                )}
            </div>

            {/* Expand button when collapsed (desktop only) */}
            {!isMobile && collapsed && (
                <div className="flex justify-center pt-2 pb-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(false)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Nav Groups */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                {visibleGroups.map(group => (
                    <div key={group.label}>
                        {!collapsed && (
                            <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1.5 px-3">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map(item => (
                                <NavItem
                                    key={item.to}
                                    item={item}
                                    collapsed={collapsed}
                                    onClick={isMobile ? onClose : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User footer — just avatar + role + logout */}
            <div className={cn(
                'border-t border-sidebar-border p-2 shrink-0',
                collapsed ? 'flex flex-col items-center gap-1' : 'space-y-1'
            )}>
                {!collapsed && (
                    <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                            {user?.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate leading-tight">{user?.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {user?.email?.substring(0, 2).toUpperCase()}
                    </div>
                )}
                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size={collapsed ? 'icon' : 'sm'}
                    onClick={toggleTheme}
                    className={cn(
                        'text-muted-foreground hover:text-foreground w-full',
                        !collapsed && 'justify-start'
                    )}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark
                        ? <Sun className={cn('h-4 w-4 shrink-0', !collapsed && 'mr-2')} />
                        : <Moon className={cn('h-4 w-4 shrink-0', !collapsed && 'mr-2')} />
                    }
                    {!collapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
                </Button>
                <Button
                    variant="ghost"
                    size={collapsed ? 'icon' : 'sm'}
                    onClick={logout}
                    className={cn(
                        'text-destructive hover:text-destructive hover:bg-destructive/10 w-full',
                        !collapsed && 'justify-start'
                    )}
                >
                    <LogOut className={cn('h-4 w-4 shrink-0', !collapsed && 'mr-2')} />
                    {!collapsed && 'Log out'}
                </Button>
            </div>
        </aside>
    );
}

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full">
                <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={false} />
            </div>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={cn(
                'fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300',
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                <Sidebar
                    collapsed={false}
                    setCollapsed={() => { }}
                    onClose={() => setMobileOpen(false)}
                    isMobile={true}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center h-14 px-4 border-b bg-background shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Link to="/" className="ml-3 font-bold text-primary flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">CT</span>
                        Admin Panel
                    </Link>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
