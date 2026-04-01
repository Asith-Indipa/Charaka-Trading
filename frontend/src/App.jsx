
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Vehicles from '@/pages/Vehicles';
import VehicleDetails from '@/pages/VehicleDetails';
import Dashboard from '@/pages/admin/Dashboard';
import Transactions from '@/pages/admin/Transactions';
import TransactionDetails from '@/pages/admin/TransactionDetails';
import AddVehicle from '@/pages/admin/AddVehicle';
import EditVehicle from '@/pages/admin/EditVehicle';
import AddTransaction from '@/pages/admin/AddTransaction';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import AccessDenied from '@/pages/AccessDenied';
import NotFound from '@/pages/NotFound';
import { lazy } from 'react';
import { PERMISSIONS } from '@/utils/roles';

const AdminVehicles = lazy(() => import('@/pages/admin/AdminVehicles'));
const StoreSettings = lazy(() => import('@/pages/admin/StoreSettings'));
const Users = lazy(() => import('@/pages/admin/Users'));
const AdminVehicleDetails = lazy(() => import('@/pages/admin/AdminVehicleDetails'));
const Analytics = lazy(() => import('@/pages/admin/Analytics'));
const Permissions = lazy(() => import('@/pages/admin/Permissions'));

const queryClient = new QueryClient();

const ProtectedRoute = ({ permission = null, adminOnly = false }) => {
  const { user, isAuthenticated, loading, can } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (permission && !can(permission)) {
    return <AccessDenied />;
  }

  if (adminOnly && user.role !== 'admin' && user.role !== 'moderator') {
    return <AccessDenied />;
  }

  return <Outlet />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="vehicles/:id" element={<VehicleDetails />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Admin Routes - Granular */}
              <Route element={<ProtectedRoute permission={PERMISSIONS.ANALYTICS_VIEW} />}>
                <Route path="admin/dashboard" element={<Dashboard />} />
                <Route path="admin/analytics" element={<Analytics />} />
              </Route>

              <Route element={<ProtectedRoute permission={PERMISSIONS.TRANSACTION_VIEW} />}>
                <Route path="admin/transactions" element={<Transactions />} />
                <Route path="admin/transactions/:id" element={<TransactionDetails />} />
              </Route>

              <Route element={<ProtectedRoute permission={PERMISSIONS.TRANSACTION_CREATE} />}>
                <Route path="admin/transactions/new" element={<AddTransaction />} />
              </Route>

              <Route element={<ProtectedRoute permission={PERMISSIONS.USER_CREATE} />}>
                <Route path="admin/users" element={<Users />} />
                <Route path="admin/permissions" element={<Navigate to="/settings?tab=permissions" replace />} />
              </Route>

              <Route element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_VIEW} />}>
                <Route path="admin/vehicles" element={<AdminVehicles />} />
                <Route path="admin/vehicles/:id" element={<AdminVehicleDetails />} />
              </Route>

              <Route element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_CREATE} />}>
                <Route path="admin/vehicles/new" element={<AddVehicle />} />
              </Route>

              <Route element={<ProtectedRoute permission={PERMISSIONS.VEHICLE_EDIT} />}>
                <Route path="admin/vehicles/:id/edit" element={<EditVehicle />} />
              </Route>

              <Route element={<ProtectedRoute permission={PERMISSIONS.STORE_EDIT} />}>
                <Route path="admin/settings/store" element={<Navigate to="/settings?tab=store" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
