import { useState, useEffect, useCallback } from 'react';
import { supabase, fetchProfile } from '../lib/supabase';

/**
 * useAuth – verwaltet Login, Logout, Registrierung und das aktuelle Profil.
 *
 * Gibt zurück:
 *   user       – Supabase Auth-User (oder null)
 *   profile    – Datenbankprofil mit username, coins, level, etc.
 *   loading    – true während der initialen Session-Prüfung
 *   signUp     – (email, password, username) => Promise
 *   signIn     – (email, password) => Promise
 *   signOut    – () => Promise
 *   refreshProfile – () => Promise (Profil neu laden)
 */
export function useAuth() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Aktuelle Session beim Start prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    // Auf Auth-Änderungen hören (Login, Logout, Token-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return { user, profile, loading, signUp, signIn, signOut, refreshProfile };
}
