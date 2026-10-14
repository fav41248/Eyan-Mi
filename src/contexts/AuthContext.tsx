import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsGuest: (name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'ayojire1@gmail.com';

// Safe fetch helper that never throws DOMException / SyntaxError on non-JSON HTML error responses
async function safeFetchJson(url: string, options?: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'server-response-error', message: res.ok ? 'Unexpected response' : 'Server is temporarily unavailable. Please try again.' };
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: { error: 'network-error', message: err?.message || 'Connection error. Please check your network and try again.' },
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile with backend Firestore
  const syncUserToBackend = async (u: User | { uid: string; email: string; displayName?: string; photoURL?: string }) => {
    try {
      const email = u.email || 'guest@eyanmi.com';
      const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

      const { ok, data } = await safeFetchJson('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: u.uid,
          email: email,
          displayName: u.displayName || email.split('@')[0],
          photoURL: u.photoURL || '',
          role,
        }),
      });

      if (ok && data?.user) {
        setUserProfile(data.user);
      } else {
        // Fallback local profile
        setUserProfile({
          uid: u.uid,
          email,
          displayName: u.displayName || email.split('@')[0],
          photoURL: u.photoURL || '',
          role,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          celebrationsCount: 0,
        });
      }
    } catch (err) {
      console.warn('User sync notice:', err);
      const email = u.email || 'guest@eyanmi.com';
      setUserProfile({
        uid: u.uid,
        email,
        displayName: u.displayName || email.split('@')[0],
        photoURL: u.photoURL || '',
        role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        celebrationsCount: 0,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserToBackend(currentUser);
      } else {
        // Check for persistent email account session
        const storedAuthUser = localStorage.getItem('eyanmi_auth_user');
        if (storedAuthUser) {
          try {
            const parsed = JSON.parse(storedAuthUser);
            setUserProfile(parsed);
            await syncUserToBackend(parsed);
          } catch {
            localStorage.removeItem('eyanmi_auth_user');
            setUserProfile(null);
          }
        } else {
          // Check local storage for persistent guest creator session
          const storedGuest = localStorage.getItem('eyanmi_guest_user');
          if (storedGuest) {
            try {
              const parsed = JSON.parse(storedGuest);
              await syncUserToBackend(parsed);
            } catch {
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try backend authentication route first (robust, bypasses client auth console settings)
    const { ok, data } = await safeFetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: pass }),
    });

    if (ok && data?.user) {
      setUserProfile(data.user);
      localStorage.setItem('eyanmi_auth_user', JSON.stringify(data.user));
      // Also try background Firebase client auth signin if possible
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch {}
      return;
    }

    if (data?.error === 'invalid-password') {
      throw new Error('Incorrect password. Please try again.');
    }
    if (data?.error === 'user-not-found') {
      throw new Error('No account found with this email. Please check your email or click Create Free Account.');
    }
    if (data?.message) {
      throw new Error(data.message);
    }

    // 2. Fallback to Firebase client auth
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      await syncUserToBackend(cred.user);
      return;
    } catch (firebaseErr: any) {
      const errMsg = firebaseErr?.message || '';
      if (errMsg.includes('wrong-password') || errMsg.includes('invalid-credential')) {
        throw new Error('Incorrect password. Please try again.');
      }
      if (errMsg.includes('user-not-found')) {
        throw new Error('No account found with this email. Please click Create Free Account.');
      }
      throw new Error(data?.message || errMsg || 'Sign-in failed. Please verify your email and password.');
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name.trim() || cleanEmail.split('@')[0]);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (pass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // 1. Try backend registration endpoint first (robust, bypasses client auth console settings)
    const { ok, data } = await safeFetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: pass, displayName: cleanName }),
    });

    if (ok && data?.user) {
      setUserProfile(data.user);
      localStorage.setItem('eyanmi_auth_user', JSON.stringify(data.user));
      // Also try background Firebase client registration if possible
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: cleanName });
        }
      } catch {}
      return;
    }

    if (data?.error === 'email-already-in-use' || data?.message?.includes('already registered')) {
      throw new Error('This email is already registered. Please switch to Sign In with your password.');
    }
    if (data?.message) {
      throw new Error(data.message);
    }

    // 2. Fallback to Firebase client signup
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: cleanName });
      }
      await syncUserToBackend({ ...cred.user, displayName: cleanName });
      return;
    } catch (firebaseErr: any) {
      const errMsg = firebaseErr?.message || '';
      if (errMsg.includes('email-already-in-use')) {
        throw new Error('This email is already registered. Please switch to Sign In with your password.');
      }
      if (errMsg.includes('weak-password')) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (errMsg.includes('invalid-email')) {
        throw new Error('Please enter a valid email address.');
      }
      throw new Error(data?.message || errMsg || 'Sign-up could not be completed. Please try again.');
    }
  };

  const loginAsGuest = async (customName = 'Creator') => {
    const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    const guestObj = {
      uid: guestId,
      email: `${customName.toLowerCase().replace(/\s+/g, '')}@eyanmi.com`,
      displayName: customName,
      photoURL: '',
    };
    localStorage.setItem('eyanmi_guest_user', JSON.stringify(guestObj));
    await syncUserToBackend(guestObj);
  };

  const logout = async () => {
    localStorage.removeItem('eyanmi_auth_user');
    localStorage.removeItem('eyanmi_guest_user');
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const refreshUserProfile = async () => {
    if (user) {
      await syncUserToBackend(user);
    } else {
      const storedAuthUser = localStorage.getItem('eyanmi_auth_user');
      if (storedAuthUser) {
        try {
          await syncUserToBackend(JSON.parse(storedAuthUser));
        } catch {}
      } else {
        const storedGuest = localStorage.getItem('eyanmi_guest_user');
        if (storedGuest) {
          await syncUserToBackend(JSON.parse(storedGuest));
        }
      }
    }
  };

  const isAdmin =
    (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    (userProfile?.email && userProfile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    userProfile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        loginWithEmail,
        signupWithEmail,
        loginAsGuest,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
