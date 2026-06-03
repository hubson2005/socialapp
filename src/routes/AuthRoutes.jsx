import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import Dashboard     from '../pages/Dashboard';
import UserDashboard from '../pages/UserDashboard';

// ─── GUARD 1 — Utilisateur connecté requis ───────────────────────────────────
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}

// ─── GUARD 2 — Rôle "admin" requis ───────────────────────────────────────────
export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading)  return <AuthLoadingScreen />;
  if (!user)    return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

// ─── GUARD 3 — Page publique uniquement (login) ──────────────────────────────
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (user) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
}

// ─── GUARD 4 — Dashboard selon le rôle ──────────────────────────────────────
export function RoleBasedDashboard() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;

  if (isAdmin) {
    if (window.location.hostname === 'socialapp.work') {
      window.location.href = 'https://admin.socialapp.work/dashboard';
      return null;
    }
    return <Dashboard />;
  }

  return <UserDashboard />;
}

// ─── Écran de chargement ─────────────────────────────────────────────────────
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