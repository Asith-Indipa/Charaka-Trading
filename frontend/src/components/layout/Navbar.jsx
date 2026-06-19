// this is the navbar component

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut, LayoutDashboard, Settings, Menu, Building2, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PERMISSIONS } from '@/utils/roles';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function Navbar() {
    const { user, logout, isAuthenticated, isAdmin, can } = useAuth();
    const { isDark, toggle: toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <img src={isDark ? "/logo-dark.png" : "/logo.png"} alt="Logo" className="h-12 w-auto rounded-md" />
                    Charaka Trading
                </Link>
                <nav className="flex items-center gap-6 hidden md:flex">
                    <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                        Home
                    </Link>
                    <Link to="/vehicles" className="text-sm font-medium hover:text-primary transition-colors">
                        Vehicles
                    </Link>
                    {can(PERMISSIONS.ANALYTICS_VIEW) && (
                        <Link to="/admin/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                            Dashboard
                        </Link>
                    )}
                </nav>
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="h-9 w-9"
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        id="theme-toggle-btn"
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Charaka Trading</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-4 mt-8">
                                    <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                                        Home
                                    </Link>
                                    <Link to="/vehicles" className="text-sm font-medium hover:text-primary transition-colors">
                                        Vehicles
                                    </Link>
                                    {can(PERMISSIONS.ANALYTICS_VIEW) && (
                                        <Link to="/admin/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                                            Dashboard
                                        </Link>
                                    )}
                                    <div className="flex items-center justify-between border-t border-b py-4 my-2">
                                        <span className="text-sm font-medium">Theme</span>
                                        <Button variant="outline" size="sm" onClick={toggleTheme} className="flex gap-2">
                                            {isDark ? (
                                                <><Sun className="h-4 w-4" /> Light</>
                                            ) : (
                                                <><Moon className="h-4 w-4" /> Dark</>
                                            )}
                                        </Button>
                                    </div>
                                    {isAuthenticated ? (
                                        <>
                                            <div className="border-t pt-4 mt-2">
                                                <p className="text-xs text-muted-foreground mb-2">My Account</p>
                                                <Link to="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors py-2">
                                                    <User className="h-4 w-4" /> Profile
                                                </Link>
                                                <Link to="/settings" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors py-2">
                                                    <Settings className="h-4 w-4" /> Settings
                                                </Link>
                                                <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors py-2 w-full text-left">
                                                    <LogOut className="h-4 w-4" /> Log out
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-2 mt-4">
                                            <Button variant="outline" asChild className="w-full">
                                                <Link to="/login">Login</Link>
                                            </Button>
                                            <Button asChild className="w-full">
                                                <Link to="/register">Register</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* This is the profile dropdown*/}
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full hidden md:flex">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/avatars/01.png" alt={user?.email} />
                                        <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.email}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/profile" className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                {can(PERMISSIONS.ANALYTICS_VIEW) && (
                                    <DropdownMenuItem asChild>
                                        <Link to="/admin/dashboard" className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {can(PERMISSIONS.STORE_EDIT) && (
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings?tab=store" className="cursor-pointer">
                                            <Building2 className="mr-2 h-4 w-4" />
                                            <span>Store Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {can(PERMISSIONS.USER_CREATE) && (
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings?tab=permissions" className="cursor-pointer">
                                            <Shield className="mr-2 h-4 w-4" />
                                            <span>Permissions</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link to="/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="hidden md:flex items-center gap-4">
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/login">Login</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link to="/register">Register</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
