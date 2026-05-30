import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import PublicProfile from "./pages/PublicProfile";
import Home from "./pages/Home";

import {
  ProtectedRoute,
  AdminRoute,
  PublicOnlyRoute
} from "./routes/AuthRoutes";

// Détection admin sous-domaine
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

      {/* ✅ Profil public — https://www.socialapp.work/:username
          Doit être EN DERNIER pour ne pas intercepter /login, /dashboard, etc. */}
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

