import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import UserDashboard  from "./pages/UserDashboard";
import PublicProfile  from "./pages/PublicProfile";
import Home           from "./pages/Home";
import PrivacyPolicy  from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DeleteAccount  from "./pages/DeleteAccount";
import ResetPassword  from "./pages/ResetPassword";
import WhatsAppCRM    from "./pages/WhatsAppCRM";
import { Loader2 } from "lucide-react";
import {
  ProtectedRoute,
  AdminRoute,
  PublicOnlyRoute,
} from "./routes/AuthRoutes";

const isAdminDomain = () => {
  const hostname = window.location.hostname;
  return (
    hostname === "admin.socialapp.work" ||
    import.meta.env.VITE_FORCE_ADMIN === "true"
  );
};

function AdminApp() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute redirectTo="/dashboard">
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/dashboard/whatsapp-crm"
        element={
          <AdminRoute>
            <WhatsAppCRM />
          </AdminRoute>
        }
      />
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function PublicApp() {
  return (
    <Routes>
      <Route path="/"                  element={<Home />} />

      {/* Routes légales — chemins longs (liens du footer) */}
      <Route path="/privacy-policy"    element={<PrivacyPolicy />} />
      <Route path="/terms-of-service"  element={<TermsOfService />} />

      {/* Alias courts — redirigent vers les routes canoniques */}
      <Route path="/privacy"           element={<Navigate to="/privacy-policy" replace />} />
      <Route path="/terms"             element={<Navigate to="/terms-of-service" replace />} />

      <Route path="/delete-account"    element={<DeleteAccount />} />
      <Route path="/reset-password"    element={<ResetPassword />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute redirectTo="/dashboard">
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/whatsapp-crm"
        element={
          <ProtectedRoute>
            <WhatsAppCRM />
          </ProtectedRoute>
        }
      />
      <Route path="/:username" element={<PublicProfile />} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthLoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060412',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
    }}>
      <img
        src="/Logo_SocialApp.png"
        alt="SocialApp"
        style={{ width: 54, height: 54, borderRadius: 14, boxShadow: '0 8px 28px rgba(255,140,0,0.4)' }}
      />
      <Loader2 size={22} color="#ff8c00" className="animate-spin" />
    </div>
  );
}

function RoleBasedDashboard() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (isAdmin) {
    if (window.location.hostname === "socialapp.work") {
      window.location.href = "https://admin.socialapp.work/dashboard";
      return null;
    }
    return <Dashboard />;
  }
  return <UserDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      {isAdminDomain() ? <AdminApp /> : <PublicApp />}
    </AuthProvider>
  );
}