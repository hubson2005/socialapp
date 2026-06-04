import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState('user');
  const [loading, setLoading] = useState(true);

  // ✅ Lit le rôle depuis app_metadata — non modifiable par l'utilisateur
  const fetchRole = useCallback(async () => {
    try {
      const { data: { user: u }, error } = await supabase.auth.getUser();
      if (error || !u) { setRole('user'); return; }
      // app_metadata est réservé au serveur, jamais modifiable par le client
      setRole(u.app_metadata?.role ?? 'user');
    } catch {
      setRole('user');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) fetchRole();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('[Auth] Event:', event, '| Email:', session?.user?.email);

        if (event === 'PASSWORD_RECOVERY') {
          setUser(null);
          setRole('user');
          window.location.href = '/reset-password';
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole('user');
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) fetchRole();
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchRole]);

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