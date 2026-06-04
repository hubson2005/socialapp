import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";

import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";       // dashboard ADMIN
import UserDashboard  from "./pages/UserDashboard";   // dashboard UTILISATEUR
import PublicProfile  from "./pages/PublicProfile";
import Home           from "./pages/Home";
import PrivacyPolicy  from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DeleteAccount  from "./pages/DeleteAccount";
import ResetPassword  from "./pages/ResetPassword";
import { Loader2 } from "lucide-react";

import {
  ProtectedRoute,
  AdminRoute,
  PublicOnlyRoute,
} from "./routes/AuthRoutes";

// ─── Détecte si on est sur le sous-domaine admin ───────────────────────────
const isAdminDomain = () => {
  const hostname = window.location.hostname;
  return (
    hostname === "admin.socialapp.work" ||
    import.meta.env.VITE_FORCE_ADMIN === "true"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP ADMIN  (admin.socialapp.work)
// ─────────────────────────────────────────────────────────────────────────────
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
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PUBLIQUE  (socialapp.work)
// ─────────────────────────────────────────────────────────────────────────────
function PublicApp() {
  return (
    <Routes>
      <Route path="/"               element={<Home />} />
      <Route path="/privacy"        element={<PrivacyPolicy />} />
      <Route path="/terms"          element={<TermsOfService />} />
      <Route path="/delete-account" element={<DeleteAccount />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
      <Route path="/:username" element={<PublicProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CORRECTION PRINCIPALE : attend que le rôle soit chargé avant de rendre
// ─────────────────────────────────────────────────────────────────────────────
function RoleBasedDashboard() {
  const { isAdmin, loading } = useAuth();

  // ✅ Attend que fetchRole soit terminé — évite le flash UserDashboard pour les admins
  if (loading) {
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

  if (isAdmin) {
    // En production → redirige vers le sous-domaine admin
    if (window.location.hostname === "socialapp.work") {
      window.location.href = "https://admin.socialapp.work/dashboard";
      return null;
    }
    // En développement → affiche directement le Dashboard admin
    return <Dashboard />;
  }

  // ✅ Seulement ici, on est sûr que l'utilisateur n'est PAS admin
  return <UserDashboard />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      {isAdminDomain() ? <AdminApp /> : <PublicApp />}
    </AuthProvider>
  );
}