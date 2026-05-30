import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import PublicProfile from "./pages/PublicProfile";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import {
  ProtectedRoute,
  AdminRoute,
  PublicOnlyRoute,
} from "./routes/AuthRoutes";

// ─────────────────────────────────────────────
// Détection admin sous-domaine
// ─────────────────────────────────────────────
const isAdminDomain = () => {
  const hostname = window.location.hostname;

  return (
    hostname === "admin.socialapp.work" ||
    hostname === "localhost"
  );
};

// ─────────────────────────────────────────────
// APP ADMIN
// ─────────────────────────────────────────────
function AdminApp() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────
// APP PUBLIQUE
// ─────────────────────────────────────────────
function PublicApp() {
  return (
    <Routes>
      {/* Accueil */}
      <Route path="/" element={<Home />} />

      {/* Pages légales */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/delete-account" element={<DeleteAccount />} />

      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* Dashboard utilisateur */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* Profil public */}
      {/* IMPORTANT : toujours après les routes fixes */}
      <Route path="/:username" element={<PublicProfile />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      {isAdminDomain() ? <AdminApp /> : <PublicApp />}
    </AuthProvider>
  );
}