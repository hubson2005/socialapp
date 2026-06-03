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

import {
  ProtectedRoute,
  AdminRoute,
  PublicOnlyRoute,
} from "./routes/AuthRoutes";

// ─── Détecte si on est sur le sous-domaine admin ───────────────────────────
// ⚠️  "localhost" est RETIRÉ : en dev, on passe toujours par PublicApp.
//     Pour tester AdminApp en local, utilise la variable d'environnement.
const isAdminDomain = () => {
  const hostname = window.location.hostname;
  return (
    hostname === "admin.socialapp.work" ||
    import.meta.env.VITE_FORCE_ADMIN === "true" // yarn dev avec VITE_FORCE_ADMIN=true
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP ADMIN  (sous-domaine admin.socialapp.work)
// Toutes les routes sont protégées par AdminRoute → seuls les admins accèdent
// ─────────────────────────────────────────────────────────────────────────────
function AdminApp() {
  return (
    <Routes>
      {/* Connexion — redirige vers /dashboard si déjà connecté */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute redirectTo="/dashboard">
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* Réinitialisation mot de passe — toujours accessible */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Dashboard admin — AdminRoute vérifie user connecté + rôle "admin" */}
      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />

      {/* Racine → dashboard admin */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PUBLIQUE  (socialapp.work + localhost)
// ─────────────────────────────────────────────────────────────────────────────
function PublicApp() {
  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/"               element={<Home />} />
      <Route path="/privacy"        element={<PrivacyPolicy />} />
      <Route path="/terms"          element={<TermsOfService />} />
      <Route path="/delete-account" element={<DeleteAccount />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Connexion — si déjà connecté, redirige selon le rôle */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute redirectTo="/dashboard">
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* Dashboard utilisateur — ProtectedRoute vérifie uniquement la connexion */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />

      {/* Profil public — doit être en dernier pour ne pas capturer /login etc. */}
      <Route path="/:username" element={<PublicProfile />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Redirige automatiquement les admins vers le bon dashboard
// Un admin qui arrive sur /dashboard dans PublicApp est envoyé sur le
// sous-domaine admin (ou sur /dashboard avec le bon composant en dev).
// ─────────────────────────────────────────────────────────────────────────────
function RoleBasedDashboard() {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    // En production → sous-domaine admin
    if (window.location.hostname === "socialapp.work") {
      window.location.href = "https://admin.socialapp.work/dashboard";
      return null;
    }
    // En développement → affiche directement le Dashboard admin
    return <Dashboard />;
  }

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