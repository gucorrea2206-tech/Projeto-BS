import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isActive: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isActive: false,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await checkAdminStatus(firebaseUser);
      } else {
        setIsAdmin(false);
        setIsActive(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async (firebaseUser: User) => {
    try {
      // Check if user is the specified admin
      const isDefaultAdmin = firebaseUser.email === 'gu.correa98@gmail.com' || firebaseUser.email === 'gu.correa2206@gmail.com';
      
      // Get or create user profile in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      let userRole = 'collaborator';
      let userActive = isDefaultAdmin;

      if (userSnap.exists()) {
        const data = userSnap.data();
        userRole = data.role || 'collaborator';
        userActive = data.isActive ?? isDefaultAdmin;
      } else {
        userRole = isDefaultAdmin ? 'admin' : 'collaborator';
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Membro',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || '',
          role: userRole,
          isAdmin: userRole === 'admin',
          isActive: userActive
        });
      }

      setIsAdmin(userRole === 'admin' || isDefaultAdmin);
      setIsActive(userActive);

      // Sync with team_members collection
      const teamMemberRef = doc(db, 'team_members', firebaseUser.uid);
      const teamMemberSnap = await getDoc(teamMemberRef);

      if (!teamMemberSnap.exists()) {
        await setDoc(teamMemberRef, {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Membro',
          email: firebaseUser.email,
          role: userRole === 'admin' ? 'Administrador' : 'Colaborador',
          permission: userRole === 'admin' ? 'admin' : 'collaborator',
          avatar: firebaseUser.photoURL || '',
          isActive: userActive,
          created_at: new Date().toISOString()
        });
      } else {
        const updates: any = {};
        const data = teamMemberSnap.data();
        if (isDefaultAdmin && data.permission !== 'admin') {
          updates.permission = 'admin';
          updates.role = 'Administrador';
          updates.isActive = true;
        }
        if (!data.name) {
          updates.name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Novo Membro';
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(teamMemberRef, updates);
        }
      }
    } catch (error) {
      console.warn('Error checking admin status:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.warn('Error signing out:', error);
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
    <AuthContext.Provider value={{ user, isAdmin, isActive, isLoading: loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
