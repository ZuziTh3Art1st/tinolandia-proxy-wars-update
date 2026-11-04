'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  google: () => Promise<void>;
  logOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function friendlyAuthError(err: any): string {
  const code: string = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Incorrect email or password.';
  if (code.includes('email-already-in-use')) return 'That email already has an account. Try logging in.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('invalid-email')) return 'That email address does not look right.';
  if (code.includes('operation-not-allowed'))
    return 'This sign-in method is not enabled yet in the Firebase console (Authentication → Sign-in method).';
  if (code.includes('popup-closed')) return 'Sign-in window was closed before finishing.';
  if (code.includes('unauthorized-domain'))
    return 'This website address is not authorised in Firebase (Authentication → Settings → Authorized domains).';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a minute and try again.';
  return err?.message || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    signUp: async (email, password, displayName) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 24) });
        await cred.user.getIdToken(true); // refresh so the new name is in the token
        setUser({ ...cred.user } as User);
      }
    },
    logIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth, email);
    },
    google: async () => {
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    logOut: async () => {
      await signOut(auth);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
