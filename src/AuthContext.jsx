import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // FETCH ROLE — toujours sécurisé
  // ─────────────────────────────────────────────
  const fetchRole = useCallback(async (userId) => {
    if (!userId) {
      setRole(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] fetchRole error:', error);
        setRole('user');
        return;
      }
      setRole(data?.role ?? 'user');
    } catch (err) {
      console.error('[AuthContext] fetchRole unexpected error:', err);
      setRole('user');
    }
  }, []);

  // ─────────────────────────────────────────────
  // INIT AUTH — un seul flux, pas de double appel
  // ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // 1. Le listener est enregistré EN PREMIER pour ne rater aucun événement
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[Auth] Event:', event);

      // Récupération de mot de passe → redirection immédiate
      if (event === 'PASSWORD_RECOVERY') {
        setUser(null);
        setRole(null);
        setLoading(false);
        window.location.href = '/reset-password';
        return;
      }

      // Déconnexion
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // Connexion / refresh token / session initiale
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        console.log('[Auth] User ID:', currentUser.id);
        console.log('[Auth] Email:', currentUser.email);
        await fetchRole(currentUser.id);
      } else {
        setRole(null);
      }

      if (mounted) setLoading(false);
    });

    // 2. Vérifie la session existante :
    //    - Si une session existe → onAuthStateChange se déclenche avec
    //      INITIAL_SESSION et appellera setLoading(false) lui-même.
    //    - Si pas de session → on sort du loading immédiatement ici.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('[AuthContext] getSession error:', error);
      }
      if (!session) {
        // Pas de session active : on sort du loading sans attendre le listener
        setUser(null);
        setRole(null);
        setLoading(false);
      }
      // Si session présente → INITIAL_SESSION gérera le setLoading(false)
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  // ─────────────────────────────────────────────
  // AUTH METHODS
  // ─────────────────────────────────────────────
  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange(SIGNED_OUT) s'occupe de reset l'état
  };

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
}