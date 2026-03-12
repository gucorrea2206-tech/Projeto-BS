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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
            permission: 'admin'
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
    await supabase.auth.signOut();
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
