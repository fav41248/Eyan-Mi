import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
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
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsGuest: (name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'ayojire1@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile with backend Firestore
  const syncUserToBackend = async (u: User | { uid: string; email: string; displayName?: string; photoURL?: string }) => {
    try {
      const email = u.email || 'guest@eyanmi.com';
      const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

      const res = await fetch('/api/user/sync', {
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

      if (res.ok) {
        const data = await res.json();
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

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserToBackend(result.user);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Firebase Auth client first
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      await syncUserToBackend(cred.user);
      return;
    } catch (firebaseErr: any) {
      const errCode = firebaseErr?.code || '';
      const errMsg = firebaseErr?.message || '';

      // If Firebase Auth has disabled email/pass (operation-not-allowed) or user not in client auth
      if (
        errCode === 'auth/operation-not-allowed' ||
        errMsg.includes('operation-not-allowed') ||
        errCode === 'auth/user-not-found' ||
        errCode === 'auth/invalid-credential' ||
        errCode === 'auth/configuration-not-found'
      ) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: pass }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUserProfile(data.user);
          localStorage.setItem('eyanmi_auth_user', JSON.stringify(data.user));
          return;
        }

        if (data?.error === 'invalid-password') {
          throw new Error('Incorrect password. Please try again.');
        }
        if (data?.error === 'user-not-found') {
          throw new Error('No account found with this email. Please check your email or create an account.');
        }
        throw new Error(data?.message || 'Invalid email or password.');
      }

      if (errCode === 'auth/wrong-password' || errMsg.includes('wrong-password')) {
        throw new Error('Incorrect password. Please try again.');
      }
      if (errCode === 'auth/user-not-found' || errMsg.includes('user-not-found')) {
        throw new Error('No account found with this email. Please create an account.');
      }

      throw new Error(errMsg || 'Sign-in failed. Please check your credentials.');
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name.trim() || cleanEmail.split('@')[0]);

    // 1. Try Firebase Auth first
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: cleanName });
      }
      await syncUserToBackend({ ...cred.user, displayName: cleanName });
      return;
    } catch (firebaseErr: any) {
      const errCode = firebaseErr?.code || '';
      const errMsg = firebaseErr?.message || '';

      // If email is already in use, attempt automatic sign-in with the provided password!
      if (errCode === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          await syncUserToBackend(cred.user);
          return;
        } catch {
          // If Firebase client login fails, check backend login
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail, password: pass }),
            });
            const data = await res.json();
            if (res.ok && data.user) {
              setUserProfile(data.user);
              localStorage.setItem('eyanmi_auth_user', JSON.stringify(data.user));
              return;
            }
          } catch {}

          throw new Error('This email is already registered. Please switch to Sign In with your password.');
        }
      }

      // If Firebase Auth provider is not enabled in Firebase Console (operation-not-allowed)
      if (
        errCode === 'auth/operation-not-allowed' ||
        errMsg.includes('operation-not-allowed') ||
        errCode === 'auth/configuration-not-found'
      ) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: pass, displayName: cleanName }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Registration failed. Please try again.');
        }
        setUserProfile(data.user);
        localStorage.setItem('eyanmi_auth_user', JSON.stringify(data.user));
        return;
      }

      if (errCode === 'auth/weak-password' || errMsg.includes('weak-password')) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (errCode === 'auth/invalid-email' || errMsg.includes('invalid-email')) {
        throw new Error('Please enter a valid email address.');
      }

      // Final fallback to server registration
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: pass, displayName: cleanName }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUserProfile(data.user);
          localStorage.setItem('eyanmi_auth_user', JSON.stringify(data.user));
          return;
        }
      } catch {}

      throw new Error(errMsg || 'Sign-up failed. Please try again.');
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
        loginWithGoogle,
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
