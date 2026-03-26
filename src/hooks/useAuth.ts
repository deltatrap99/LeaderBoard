import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

export type UserRole = 'superadmin' | 'admin' | null;

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser && db) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const data = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: data?.displayName || firebaseUser.displayName,
          role: (data?.role as UserRole) || null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth || !db) throw new Error('Firebase chưa được cấu hình.');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
    const data = userDoc.data();
    if (!data || !data.role) {
      await signOut(auth);
      throw new Error('Tài khoản không có quyền truy cập CMS.');
    }
    return credential;
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
  };

  return { user, loading, login, logout };
}
