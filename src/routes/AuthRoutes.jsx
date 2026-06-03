import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

// ─── Spinner minimal pendant le chargement de la session ──────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1a1825",
    }}>
      <div style={{
        width: "32px", height: "32px",
        border: "3px solid rgba(255,140,0,0.2)",
        borderTop: "3px solid #ff8c00",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Route protégée — utilisateur connecté uniquement ─────────────────────
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    // Mémorise la page demandée pour y revenir après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─── Route admin — utilisateur connecté + rôle "admin" ────────────────────
export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  // Pas connecté → page de login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Connecté mais pas admin → dashboard utilisateur
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─── Route publique uniquement — redirige si déjà connecté ────────────────
export function PublicOnlyRoute({ children, redirectTo = "/dashboard" }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user) {
    // Admin sur le domaine public → sous-domaine admin en production
    if (isAdmin && window.location.hostname === "socialapp.work") {
      window.location.href = "https://admin.socialapp.work/dashboard";
      return null;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}