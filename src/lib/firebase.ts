import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import defaultConfig from '../../firebase-applet-config.example.json';

// Use import.meta.glob for optional JSON import without build crashes if file is absent
const configModules: Record<string, any> = import.meta.glob('../../firebase-applet-config.json', {
  eager: true,
});
const rawConfig = configModules['../../firebase-applet-config.json']?.default || defaultConfig;

// Allow overriding via environment variables in CI/CD, Netlify, or Vercel
const firebaseConfig = {
  ...rawConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || rawConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with experimentalForceLongPolling to prevent 10s backend timeout in iframe/cloud run environments
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);

// Initialize Firebase Authentication
export const auth = getAuth(app);
