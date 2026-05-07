import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";         // Dashboard ADMIN
import UserDashboard from "./pages/UserDashboard"; // Dashboard UTILISATEUR
import PublicProfile from "./pages/PublicProfile";
import Home from "./pages/Home";

// ✅ Détecte si on est sur le sous-domaine admin
const isAdmin = () => {
  const hostname = window.location.hostname;
  return hostname === 'admin.socialapp.work' || hostname === 'localhost';
};

// ── Garde : utilisateur connecté requis ──────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060412' }}>
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

// ── Garde : redirige vers /dashboard si déjà connecté ───────────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060412' }}>
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" replace />;
}

// ── App ADMIN (admin.socialapp.work ou localhost) ────────────────────────────
function AdminApp() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ── App PUBLIQUE (socialapp.work) ────────────────────────────────────────────
function PublicApp() {
  return (
    <Routes>
      {/* Page d'accueil publique */}
      <Route path="/" element={<Home />} />

      {/* Profil public partageable */}
      <Route path="/profil/:username" element={<PublicProfile />} />

      {/* Connexion utilisateur */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* ✅ Dashboard utilisateur (limité) — protégé par auth */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><UserDashboard /></ProtectedRoute>}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {isAdmin() ? <AdminApp /> : <PublicApp />}
    </AuthProvider>
  );
}