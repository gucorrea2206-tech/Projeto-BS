import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle unhandled promise rejections for Supabase auth errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason && 
        (event.reason.message?.includes('Refresh Token') || 
         event.reason.message?.includes('refresh_token') ||
         event.reason.name === 'AuthApiError')
      ) {
        console.warn('Caught auth error, clearing session:', event.reason);
        event.preventDefault(); // Prevent Vite error overlay
        supabase.auth.signOut().catch(() => {
          // Fallback: clear local storage if signOut fails
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        });
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        if (error.message.includes('Refresh Token') || error.message.includes('refresh_token')) {
          // Clear invalid session
          supabase.auth.signOut().catch(console.error);
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user);
      setLoading(false);
    }).catch(error => {
      console.error('Unhandled error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        checkAdminStatus(session?.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const checkAdminStatus = async (user: User | null | undefined) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    // Check if user is the specified admin
    if (user.email === 'gu.correa98@gmail.com') {
      setIsAdmin(true);
      
      // Ensure they exist in team_members as admin
      try {
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (!existingMember) {
          await supabase.from('team_members').insert({
            name: 'Guilherme Correa',
            email: user.email,
            role: 'Administrador',
            permission: 'admin',
            avatar: `user${Math.floor(Math.random() * 100)}`
          });
        }
      } catch (error) {
        console.error('Error checking/creating admin user:', error);
      }
    } else {
      // Check permission in DB for other users
      try {
        const { data } = await supabase
          .from('team_members')
          .select('permission')
          .eq('email', user.email)
          .maybeSingle();
          
        setIsAdmin(data?.permission === 'admin');
      } catch (error) {
        setIsAdmin(false);
      }
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear session on error
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
