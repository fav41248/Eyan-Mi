import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
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
const USERS_COLLECTION = 'users';

// Client-side SHA-256 password hashing for static hosting fallback
async function clientHashPassword(password: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(password + 'eyanmi_secure_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return password; // Fallback plain text if subtle crypto unavailable
  }
}

// Safe fetch helper that handles static hosting (Netlify/Vercel 404s) gracefully
async function safeFetchJson(url: string, options?: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'server-response-error', message: res.ok ? 'Unexpected response' : 'Server is temporarily unavailable.' };
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: { error: 'network-error', message: err?.message || 'Connection error.' },
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile with backend or direct Firestore fallback
  const syncUserToBackend = async (u: User | { uid: string; email: string; displayName?: string; photoURL?: string; role?: string; celebrationsCount?: number; createdAt?: string }) => {
    try {
      const email = u.email || 'guest@eyanmi.com';
      const role = (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : ((u as any).role || 'user')) as 'admin' | 'user';

      // 1. Try backend API
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
        return;
      }

      // 2. Fallback: Direct Firestore write (for static live sites like Netlify)
      const userRef = doc(db, USERS_COLLECTION, u.uid);
      const userSnap = await getDoc(userRef);
      const now = new Date().toISOString();

      let profile: UserProfile;
      if (userSnap.exists()) {
        const existing = userSnap.data() as UserProfile;
        profile = {
          ...existing,
          lastLoginAt: now,
          displayName: u.displayName || existing.displayName,
        };
        await setDoc(userRef, { lastLoginAt: now }, { merge: true });
      } else {
        profile = {
          uid: u.uid,
          email,
          displayName: u.displayName || email.split('@')[0],
          photoURL: u.photoURL || '',
          role,
          celebrationsCount: 0,
          createdAt: now,
          lastLoginAt: now,
        };
        await setDoc(userRef, profile);
      }
      setUserProfile(profile);
    } catch (err) {
      console.warn('User sync fallback notice:', err);
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
    const passHash = await clientHashPassword(pass);
    const now = new Date().toISOString();

    // Instant local check/fallback
    const stored = localStorage.getItem('eyanmi_auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.email === cleanEmail) {
          setUserProfile(parsed);
          try { await signInWithEmailAndPassword(auth, cleanEmail, pass); } catch {}
          return;
        }
      } catch {}
    }

    // Fast non-blocking query with timeout race
    try {
      const usersCol = collection(db, USERS_COLLECTION);
      const q = query(usersCol, where('email', '==', cleanEmail));
      const snapPromise = getDocs(q);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
      const snap: any = await Promise.race([snapPromise, timeoutPromise]);

      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const userData = userDoc.data() as any;
        if (userData.passwordHash && userData.passwordHash !== passHash) {
          throw new Error('Incorrect password. Please try again.');
        }
        const { passwordHash: _, ...safeUser } = userData;
        const profile = { ...safeUser, lastLoginAt: now };
        setUserProfile(profile);
        localStorage.setItem('eyanmi_auth_user', JSON.stringify(userData));
        try { await signInWithEmailAndPassword(auth, cleanEmail, pass); } catch {}
        return;
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Incorrect password')) {
        throw err;
      }
    }

    // Fallback instant login/signup profile if not found in db yet
    const isSuperAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const uid = `usr_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    const profile: UserProfile = {
      uid,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: '',
      role: isSuperAdmin ? 'admin' : 'user',
      celebrationsCount: 0,
      createdAt: now,
      lastLoginAt: now,
    };
    setUserProfile(profile);
    localStorage.setItem('eyanmi_auth_user', JSON.stringify({ ...profile, passwordHash: passHash }));
    setDoc(doc(db, USERS_COLLECTION, uid), { ...profile, passwordHash: passHash }, { merge: true }).catch(() => {});
    try { await signInWithEmailAndPassword(auth, cleanEmail, pass); } catch {}
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

    const isSuperAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const now = new Date().toISOString();
    const uid = `usr_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    const passHash = await clientHashPassword(pass);

    const profile: UserProfile = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: '',
      role: isSuperAdmin ? 'admin' : 'user',
      celebrationsCount: 0,
      createdAt: now,
      lastLoginAt: now,
    };

    // 1. Instant local state update & persistence (zero standstill)
    setUserProfile(profile);
    localStorage.setItem('eyanmi_auth_user', JSON.stringify({ ...profile, passwordHash: passHash }));

    // 2. Non-blocking background Firestore write & auth sync
    setDoc(doc(db, USERS_COLLECTION, uid), { ...profile, passwordHash: passHash }, { merge: true }).catch(() => {});
    try { createUserWithEmailAndPassword(auth, cleanEmail, pass); } catch {}
    
    // Small artificial micro-delay to ensure smooth UI transition and success notification
    await new Promise((r) => setTimeout(r, 400));
  };

  const loginAsGuest = async (customName = 'Creator') => {
    const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    const guestObj = {
      uid: guestId,
      email: `${customName.toLowerCase().replace(/\s+/g, '')}@eyanmi.com`,
      displayName: customName,
      photoURL: '',
      role: 'user' as const,
      celebrationsCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    localStorage.setItem('eyanmi_guest_user', JSON.stringify(guestObj));
    await syncUserToBackend(guestObj);
  };

  const logout = async () => {
    // Instant state clearance for immediate logout
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('eyanmi_auth_user');
    localStorage.removeItem('eyanmi_guest_user');
    try { await signOut(auth); } catch {}
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
          try {
            await syncUserToBackend(JSON.parse(storedGuest));
          } catch {}
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
