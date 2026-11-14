import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { adminService } from '../services/adminService';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check active session on initial mount
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const { isAdmin: isUserAdmin, profile } = await adminService.verifyAdminAccess(session.user.id);
          if (isUserAdmin && profile) {
            setUser(session.user);
            setAdminProfile(profile);
            setIsAdmin(true);
          } else {
            // User is authenticated but NOT an administrator
            await supabase.auth.signOut();
            setUser(null);
            setAdminProfile(null);
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error('[KMCT Notes Hub] Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    // Listen to Supabase Auth state changes
    let subscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { isAdmin: isUserAdmin, profile } = await adminService.verifyAdminAccess(session.user.id);
          if (isUserAdmin && profile) {
            setUser(session.user);
            setAdminProfile(profile);
            setIsAdmin(true);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setAdminProfile(null);
            setIsAdmin(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAdminProfile(null);
          setIsAdmin(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured with environment variables.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message || 'Invalid email or password.');
    }

    if (!data.user) {
      throw new Error('Authentication failed.');
    }

    // Verify administrator role in admin_profiles table
    const { isAdmin: isUserAdmin, profile } = await adminService.verifyAdminAccess(data.user.id);

    if (!isUserAdmin || !profile) {
      await supabase.auth.signOut();
      throw new Error('Access Denied: Your account is not authorized as an administrator in the KMCT Notes Hub system.');
    }

    setUser(data.user);
    setAdminProfile(profile);
    setIsAdmin(true);

    return { user: data.user, profile };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setAdminProfile(null);
    setIsAdmin(false);
  };

  const value = {
    user,
    adminProfile,
    isAdmin,
    isSuperAdmin: adminProfile?.role === 'super_admin',
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
