
import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import { ThemeProvider } from '@/context/ThemeContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Vehicles from '@/pages/Vehicles';
import VehicleDetails from '@/pages/VehicleDetails';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import AccessDenied from '@/pages/AccessDenied';
import NotFound from '@/pages/NotFound';
import { PERMISSIONS } from '@/utils/roles';
import { PageLoader } from '@/components/common/Loader';
import { Toaster } from '@/components/ui/sonner';

// Admin pages — all lazy loaded
const Dashboard          = lazy(() => import('@/pages/admin/Dashboard'));
const Analytics          = lazy(() => import('@/pages/admin/Analytics'));
const Transactions       = lazy(() => import('@/pages/admin/Transactions'));
const TransactionDetails = lazy(() => import('@/pages/admin/TransactionDetails'));
const AddTransaction     = lazy(() => import('@/pages/admin/AddTransaction'));
const AdminVehicles      = lazy(() => import('@/pages/admin/AdminVehicles'));
const AdminVehicleDetails= lazy(() => import('@/pages/admin/AdminVehicleDetails'));
const AddVehicle         = lazy(() => import('@/pages/admin/AddVehicle'));
const EditVehicle        = lazy(() => import('@/pages/admin/EditVehicle'));
const AdminBookings      = lazy(() => import('@/pages/admin/AdminBookings'));
const Users              = lazy(() => import('@/pages/admin/Users'));
const Employees          = lazy(() => import('@/pages/admin/Employees'));
const SalaryManagement   = lazy(() => import('@/pages/admin/SalaryManagement'));
const StoreSettings      = lazy(() => import('@/pages/admin/StoreSettings'));
const Permissions        = lazy(() => import('@/pages/admin/Permissions'));

const queryClient = new QueryClient();
// PageLoader is now imported from @/components/common/Loader

// Generic protected route — checks auth + optional permission
const ProtectedRoute = ({ permission = null }) => {
  const { isAuthenticated, loading, can } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <AccessDenied />;
  return <Outlet />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* ── Public + User routes (with top Navbar) ───────────────── */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="vehicles/:id" element={<VehicleDetails />} />

              {/* Authenticated-only */}
              <Route element={<ProtectedRoute />}>
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ── Admin routes (with sidebar) ───────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>

                {/* Dashboard & Analytics */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.ANALYTICS_VIEW} />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                  <Route path="analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
                </Route>

                {/* Vehicles */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_VIEW} />}>
                  <Route path="vehicles" element={<Suspense fallback={<PageLoader />}><AdminVehicles /></Suspense>} />
                  <Route path="vehicles/:id" element={<Suspense fallback={<PageLoader />}><AdminVehicleDetails /></Suspense>} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_CREATE} />}>
                  <Route path="vehicles/new" element={<Suspense fallback={<PageLoader />}><AddVehicle /></Suspense>} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_EDIT} />}>
                  <Route path="vehicles/:id/edit" element={<Suspense fallback={<PageLoader />}><EditVehicle /></Suspense>} />
                  <Route path="bookings" element={<Suspense fallback={<PageLoader />}><AdminBookings /></Suspense>} />
                </Route>

                {/* Transactions */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.TRANSACTION_VIEW} />}>
                  <Route path="transactions" element={<Suspense fallback={<PageLoader />}><Transactions /></Suspense>} />
                  <Route path="transactions/:id" element={<Suspense fallback={<PageLoader />}><TransactionDetails /></Suspense>} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.TRANSACTION_CREATE} />}>
                  <Route path="transactions/new" element={<Suspense fallback={<PageLoader />}><AddTransaction /></Suspense>} />
                </Route>

                {/* Employees & Salary */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW} />}>
                  <Route path="employees" element={<Suspense fallback={<PageLoader />}><Employees /></Suspense>} />
                </Route>
                <Route element={<ProtectedRoute permission={PERMISSIONS.EMPLOYEE_SALARY_MANAGE} />}>
                  <Route path="salary" element={<Suspense fallback={<PageLoader />}><SalaryManagement /></Suspense>} />
                </Route>

                {/* Users */}
                <Route element={<ProtectedRoute permission={PERMISSIONS.USER_VIEW} />}>
                  <Route path="users" element={<Suspense fallback={<PageLoader />}><Users /></Suspense>} />
                </Route>

                {/* Settings & Profile (inside sidebar layout) */}
                <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />

                {/* Redirects for legacy paths */}
                <Route path="permissions" element={<Navigate to="/admin/settings?tab=permissions" replace />} />
                <Route path="settings/store" element={<Navigate to="/admin/settings?tab=store" replace />} />
              </Route>
            </Route>

          </Routes>
        </AuthProvider>
        <Toaster />
      </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
