import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute, AdminRoute } from './components/ProtectedRoute';
import Auth from './pages/Auth';
import PendingAccess from './pages/PendingAccess';
import Dashboard from './pages/Dashboard';
import BacBo from './pages/BacBo';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          }
        />
        <Route
          path="/pending"
          element={
            <ProtectedRoute requireVip={false}>
              <PendingAccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Dashboard"
          element={
            <ProtectedRoute requireVip={false}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/BacBo"
          element={
            <ProtectedRoute requireVip>
              <BacBo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Profile"
          element={
            <ProtectedRoute requireVip={false}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Support"
          element={
            <ProtectedRoute requireVip={false}>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
