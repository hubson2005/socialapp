import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import Dashboard     from '../pages/Dashboard';
import UserDashboard from '../pages/UserDashboard';

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

  if (loading) return <AuthLoadingScreen />;

  // ✅ Pas connecté → login
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // ✅ Connecté mais pas admin → page d'accès refusé (plus de redirect /dashboard
  //    qui causait une boucle infinie sur admin.socialapp.work)
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#060412',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        textAlign: 'center',
      }}>
        <img
          src="/Logo_SocialApp.png"
          alt="SocialApp"
          style={{ width: 54, height: 54, borderRadius: 14 }}
        />
        <div>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
            Accès refusé
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 20px' }}>
            Vous n'avez pas les droits administrateur.
          </p>
          <a
            href="https://socialapp.work/dashboard"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Retour à mon dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}

// ─── GUARD 3 — Page publique uniquement (login) ──────────────────────────────
export function PublicOnlyRoute({ children, redirectTo = '/dashboard' }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoadingScreen />;
  if (user) {
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }
  return children;
}