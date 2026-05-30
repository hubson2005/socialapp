import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GUARD 1 — Route protégée : utilisateur connecté requis
// Usage : <ProtectedRoute><Dashboard /></ProtectedRoute>
// ─────────────────────────────────────────────────────────────────────────────
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GUARD 2 — Route admin : rôle "admin" requis en base
// Usage : <AdminRoute><AdminPanel /></AdminRoute>
// ─────────────────────────────────────────────────────────────────────────────
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(); // 🔥 mieux que single()

      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data.role === 'admin');
      }

      setChecking(false);
    };

    if (!loading) checkAdmin();
  }, [user, loading]);

  if (loading || checking) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard?error=unauthorized" replace />;
  }

  return children;
}
// ─────────────────────────────────────────────────────────────────────────────
// ✅ GUARD 3 — Route publique uniquement (login, register)
// Redirige vers /dashboard si déjà connecté
// Usage : <PublicOnlyRoute><Login /></PublicOnlyRoute>
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Écran de chargement pendant la vérification de session
// ─────────────────────────────────────────────────────────────────────────────
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
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          boxShadow: '0 8px 28px rgba(255,140,0,0.4)'
        }}
      />

      <Loader2 size={22} color="#ff8c00" className="animate-spin" />
    </div>
  );
}

