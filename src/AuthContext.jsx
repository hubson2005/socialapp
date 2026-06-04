import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ✅ On utilise UNIQUEMENT onAuthStateChange — plus de getSession() séparé
    // INITIAL_SESSION est le premier event, il remplace getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('[Auth] Event:', event, '| Email:', session?.user?.email);

        if (event === 'PASSWORD_RECOVERY') {
          setUser(null); setRole('user'); setLoading(false);
          window.location.href = '/reset-password';
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null); setRole('user'); setLoading(false);
          return;
        }

        // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // ✅ Rôle lu depuis app_metadata de la session — aucun appel réseau
        const role = currentUser?.app_metadata?.role ?? 'user';
        setRole(role);

        // ✅ loading = false une seule fois après INITIAL_SESSION ou SIGNED_IN
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (mounted) setLoading(false);
        }
      }
    );

    // ✅ Timeout de sécurité au cas où INITIAL_SESSION ne se déclenche pas
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole('user');
  };

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  return ctx;
}