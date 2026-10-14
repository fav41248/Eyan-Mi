import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Safely load Firebase configuration from file or fallback (prevents crash if file is deleted)
let rawFirebaseConfig: any = {};
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  const examplePath = path.resolve(__dirname, 'firebase-applet-config.example.json');
  if (fs.existsSync(configPath)) {
    rawFirebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else if (fs.existsSync(examplePath)) {
    rawFirebaseConfig = JSON.parse(fs.readFileSync(examplePath, 'utf-8'));
  }
} catch (err) {
  console.warn('Fallback: reading firebase config file:', err);
}

// Merge environment variable overrides if provided (prevents committing secrets)
const firebaseConfig = {
  ...rawFirebaseConfig,
  apiKey: process.env.FIREBASE_API_KEY || rawFirebaseConfig.apiKey,
  projectId: process.env.FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId,
  appId: process.env.FIREBASE_APP_ID || rawFirebaseConfig.appId,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || rawFirebaseConfig.authDomain,
  firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || rawFirebaseConfig.firestoreDatabaseId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket,
};

// Initialize Cloud Firestore on backend server with long polling to prevent hanging connections
const fbApp = initializeApp(firebaseConfig, 'backend-server-fb');
const db = initializeFirestore(
  fbApp,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);

// Initialize Gemini SDK with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const CELEBRATIONS_COLLECTION = 'celebrations';
const USERS_COLLECTION = 'users';
const SUPER_ADMIN_EMAIL = 'ayojire1@gmail.com';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/generate-letter - Eyan Mi AI Epistle Generator using Gemini SDK
app.post('/api/generate-letter', async (req, res) => {
  const {
    recipientName,
    nickname,
    relationship,
    occasion,
    memoriesAndTraits,
    tone = 'deeply-emotional',
  } = req.body;

  if (!recipientName) {
    return res.status(400).json({ error: 'recipientName is required' });
  }

  const dearName = nickname || recipientName;

  const prompt = `You are a master poet and intimate letter writer for "Eyan mi", a luxury celebration platform that crafts unforgettable personalized epistles.
Write a deeply moving, lyrical, and heartfelt letter dedicated to celebrating someone very special.

Details for the letter:
- Recipient Name: ${recipientName}
- Affectionate Nickname: ${dearName}
- Occasion: ${occasion || 'Celebration'}
- Relationship: ${relationship || 'Someone cherished'}
- Special memories, qualities, or inside traits: ${memoriesAndTraits || 'Warmth, rare kindness, infectious laughter, always being there for others'}
- Tone: ${tone} (e.g. deeply romantic, tear-jerker emotional, playful yet soulful, or pure gratitude)

Guidelines:
1. Write 4 to 5 expressive, flowing paragraphs. Each paragraph should be 2 to 4 sentences.
2. Separate paragraphs with double newlines.
3. Do NOT include markdown headers like '###' or titles like 'Subject:' or formal bullet points. Write directly as a personal handwritten letter.
4. Begin with a warm, intimate address like "My dearest ${dearName}," or "To my person,".
5. End with an evocative, poetic signoff and affectionate blessing.`;

  // Try fast, available models with cascade to guarantee high availability and no 503 stalls
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          maxOutputTokens: 1500,
          temperature: 0.85,
        },
      });

      const generatedText = response.text || '';
      if (generatedText.trim().length > 30) {
        return res.json({ letter: generatedText.trim(), model });
      }
    } catch (err: any) {
      console.warn(`Model ${model} attempt notice:`, err?.message || err);
      // continue to next model
    }
  }

  // Resilient fallback so the user NEVER receives a blank or failed generation
  const memoriesNote = memoriesAndTraits
    ? `I find myself remembering ${memoriesAndTraits}. It is in those quiet, unspoken moments that your beauty and genuine soul shine brightest.`
    : `There is a rare, calming sanctuary in simply being near you, watching how gracefully you turn ordinary days into holy ground.`;

  const fallbackLetter = `My dearest ${dearName},

Today, the world leans in with gratitude to celebrate you. You are more than a blessing in my life; you are an anchor, a sanctuary, and the gentle reminder that goodness still exists in its purest form.

${memoriesNote}

Your laughter has an effortless way of clearing away every doubt and quiet shadow. Thank you for the selfless generosity with which you love, and for holding space for everyone lucky enough to be part of your story.

As you step into this sacred celebration of your ${occasion || 'life'}, may the universe pour back into your hands every ounce of kindness, peace, and warmth you have poured into others. You are deeply cherished, today and for all days to come.

With all the love my heart can carry,
Forever yours.`;

  return res.json({ letter: fallbackLetter.trim(), model: 'fallback' });
});

// POST /api/shorten-url - Server-side proxy for TinyURL (avoids browser CORS restrictions)
app.post('/api/shorten-url', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    const encoded = encodeURIComponent(url);
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encoded}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const shortUrl = await response.text();
      if (shortUrl && shortUrl.startsWith('http')) {
        return res.json({ shortUrl: shortUrl.trim() });
      }
    }
  } catch (err: any) {
    console.warn('Backend TinyURL proxy notice:', err?.message || err);
  }

  // Fallback to is.gd
  try {
    const encoded = encodeURIComponent(url);
    const response = await fetch(`https://is.gd/create.php?format=simple&url=${encoded}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const shortUrl = await response.text();
      if (shortUrl && shortUrl.startsWith('http')) {
        return res.json({ shortUrl: shortUrl.trim() });
      }
    }
  } catch (err: any) {
    console.warn('Backend is.gd proxy notice:', err?.message || err);
  }

  return res.json({ shortUrl: url });
});

// Password Hashing & Verification Utilities (Hardened PBKDF2 with 100,000 iterations)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `${salt}:${hash}:${iterations}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(':');
    const salt = parts[0];
    const originalHash = parts[1];
    const iterations = parts[2] ? parseInt(parts[2], 10) : 1000; // Backwards compatible with legacy 1,000 iterations
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

// POST /api/auth/register - Direct secure registration fallback & store in Firestore
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'invalid-input', message: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = (displayName || cleanEmail.split('@')[0]).trim();
    if (password.length < 6) {
      return res.status(400).json({ error: 'weak-password', message: 'Password must be at least 6 characters' });
    }

    const usersCol = collection(db, USERS_COLLECTION);
    const q = query(usersCol, where('email', '==', cleanEmail));
    const snap = await getDocs(q);

    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const now = new Date().toISOString();

    if (!snap.empty) {
      const existingDoc = snap.docs[0];
      const existingData = existingDoc.data();

      // If user exists and password matches, smoothly log them in!
      if (existingData.passwordHash && verifyPassword(password, existingData.passwordHash)) {
        await setDoc(existingDoc.ref, { lastLoginAt: now }, { merge: true });
        const { passwordHash: _, ...safeUser } = existingData;
        return res.json({ success: true, user: { ...safeUser, lastLoginAt: now } });
      }

      // If pre-seeded or Google synced without password, initialize their password now
      if (!existingData.passwordHash) {
        const passwordHash = hashPassword(password);
        await setDoc(existingDoc.ref, { passwordHash, lastLoginAt: now }, { merge: true });
        const { passwordHash: _, ...safeUser } = existingData;
        return res.json({ success: true, user: { ...safeUser, lastLoginAt: now } });
      }

      return res.status(409).json({
        error: 'email-already-in-use',
        message: 'This email is already registered. Please sign in using your password.',
      });
    }

    // New user
    const uid = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const passwordHash = hashPassword(password);
    const userData = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: '',
      role: isSuperAdmin ? 'admin' : 'user',
      celebrationsCount: 0,
      createdAt: now,
      lastLoginAt: now,
      passwordHash,
    };

    await setDoc(doc(db, USERS_COLLECTION, uid), userData);
    const { passwordHash: _, ...safeUser } = userData;
    return res.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login - Direct login verification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'invalid-input', message: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    const usersCol = collection(db, USERS_COLLECTION);
    const q = query(usersCol, where('email', '==', cleanEmail));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Auto-provision super admin if logging in for the first time
      if (isSuperAdmin) {
        const uid = `admin_${crypto.randomBytes(6).toString('hex')}`;
        const now = new Date().toISOString();
        const passwordHash = hashPassword(password);
        const adminData = {
          uid,
          email: cleanEmail,
          displayName: 'Ayojire',
          photoURL: '',
          role: 'admin',
          celebrationsCount: 0,
          createdAt: now,
          lastLoginAt: now,
          passwordHash,
        };
        await setDoc(doc(db, USERS_COLLECTION, uid), adminData);
        const { passwordHash: _, ...safeUser } = adminData;
        return res.json({ success: true, user: safeUser });
      }

      return res.status(404).json({
        error: 'user-not-found',
        message: 'No account found with this email. Please create an account.',
      });
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    const now = new Date().toISOString();

    // If account has no password yet (e.g. pre-seeded admin record), set it now
    if (!userData.passwordHash) {
      const passwordHash = hashPassword(password);
      await setDoc(userDoc.ref, { passwordHash, lastLoginAt: now }, { merge: true });
      const { passwordHash: _, ...safeUser } = userData;
      return res.json({ success: true, user: { ...safeUser, lastLoginAt: now } });
    }

    // Verify password
    if (!verifyPassword(password, userData.passwordHash)) {
      return res.status(401).json({
        error: 'invalid-password',
        message: 'Incorrect password. Please try again.',
      });
    }

    await setDoc(userDoc.ref, { lastLoginAt: now }, { merge: true });
    const { passwordHash: _, ...safeUser } = userData;
    return res.json({ success: true, user: { ...safeUser, lastLoginAt: now } });
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// POST /api/user/sync - Synchronize user profile into Firestore
app.post('/api/user/sync', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required' });
    }

    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const existingSnap = await getDoc(userDocRef);

    const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const now = new Date().toISOString();

    let userData: any;
    if (existingSnap.exists()) {
      const current = existingSnap.data();
      userData = {
        ...current,
        email,
        displayName: displayName || current.displayName || email.split('@')[0],
        photoURL: photoURL || current.photoURL || '',
        lastLoginAt: now,
        role: isSuperAdmin ? 'admin' : (current.role || 'user'),
      };
    } else {
      userData = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || '',
        role: isSuperAdmin ? 'admin' : 'user',
        celebrationsCount: 0,
        createdAt: now,
        lastLoginAt: now,
      };
    }

    await setDoc(userDocRef, userData, { merge: true });
    return res.json({ success: true, user: userData });
  } catch (err: any) {
    console.error('Error in /api/user/sync:', err);
    return res.status(500).json({ error: err.message || 'Failed to sync user' });
  }
});

// GET /api/users - Super Admin endpoint to list all users (Secured)
app.get('/api/users', async (req, res) => {
  try {
    const adminEmail = (req.headers['x-admin-email'] as string || '').toLowerCase().trim();
    if (adminEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'forbidden', message: 'Super admin authorization required' });
    }

    const usersCol = collection(db, USERS_COLLECTION);
    const snap = await getDocs(usersCol);
    const list: any[] = [];

    snap.forEach((d) => {
      const data = d.data();
      const { passwordHash: _, ...safeUser } = data;
      list.push(safeUser);
    });

    // Sort by lastLoginAt descending
    list.sort((a, b) => new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime());

    return res.json(list);
  } catch (err: any) {
    console.error('Error in GET /api/users:', err);
    return res.status(500).json({ error: err.message || 'Failed to list users' });
  }
});

// GET /api/celebration/:id - Fetch single celebration with subdocument media merging
app.get('/api/celebration/:id', async (req, res) => {
  try {
    const rawId = req.params.id.trim().toLowerCase();
    const cleanId = rawId.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'celebrant';

    const docRef = doc(db, CELEBRATIONS_COLLECTION, cleanId);
    let snap = await getDoc(docRef);

    if (!snap.exists() && cleanId === 'precious') {
      const altSnap = await getDoc(doc(db, CELEBRATIONS_COLLECTION, 'oluwapreciousimi'));
      if (altSnap.exists()) {
        snap = altSnap;
      }
    }

    if (!snap.exists()) {
      return res.status(404).json({ error: 'Celebration not found', id: cleanId });
    }

    const data = snap.data();

    // Fetch loader photos from subdoc if root is empty
    let loaderPhotos = data.loaderPhotos || [];
    let photos = data.photos || [];
    let voiceAudioUrl = data.voiceAudioUrl || '';

    if (!loaderPhotos || loaderPhotos.length === 0) {
      try {
        const loaderSnap = await getDoc(doc(db, CELEBRATIONS_COLLECTION, snap.id, 'media', 'loader'));
        if (loaderSnap.exists() && Array.isArray(loaderSnap.data().photos)) {
          loaderPhotos = loaderSnap.data().photos;
        }
      } catch (e) {
        console.warn('Loader subdoc read note:', e);
      }
    }

    if (!photos || photos.length === 0) {
      try {
        const gallerySnap = await getDoc(doc(db, CELEBRATIONS_COLLECTION, snap.id, 'media', 'gallery'));
        if (gallerySnap.exists() && Array.isArray(gallerySnap.data().photos)) {
          photos = gallerySnap.data().photos;
        }
      } catch (e) {
        console.warn('Gallery subdoc read note:', e);
      }
    }

    if (!voiceAudioUrl && data.hasVoice) {
      try {
        const voiceSnap = await getDoc(doc(db, CELEBRATIONS_COLLECTION, snap.id, 'media', 'voice'));
        if (voiceSnap.exists() && voiceSnap.data().audioUrl) {
          voiceAudioUrl = voiceSnap.data().audioUrl;
        }
      } catch (e) {
        console.warn('Voice subdoc read note:', e);
      }
    }

    const merged = {
      ...data,
      id: cleanId,
      loaderPhotos,
      photos,
      voiceAudioUrl,
    };

    return res.json(merged);
  } catch (err: any) {
    console.error(`Error in GET /api/celebration/${req.params.id}:`, err);
    return res.status(500).json({ error: err.message || 'Failed to fetch celebration' });
  }
});

// GET /api/celebrations - Fetch celebrations (optional userId filter)
app.get('/api/celebrations', async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const colRef = collection(db, CELEBRATIONS_COLLECTION);

    let snap;
    if (userId) {
      const q = query(colRef, where('userId', '==', userId));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(colRef);
    }

    const list: any[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        ...data,
      });
    });

    list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    return res.json(list);
  } catch (err: any) {
    console.error('Error in GET /api/celebrations:', err);
    return res.status(500).json({ error: err.message || 'Failed to list celebrations' });
  }
});

// POST /api/celebration - Save celebration with automatic subdocument chunking
app.post('/api/celebration', async (req, res) => {
  try {
    const celebration = req.body;
    if (!celebration || (!celebration.id && !celebration.recipientName)) {
      return res.status(400).json({ error: 'Invalid payload: missing id or recipientName' });
    }

    const cleanId = (celebration.id || celebration.recipientName)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'celebrant';

    const rawEpistle = (
      celebration.epistleText !== undefined
        ? celebration.epistleText
        : (celebration.epistleParagraphs ? celebration.epistleParagraphs.map((p: any) => p.text).join('\n\n') : '')
    ).trim();

    const normalizedParas = rawEpistle
      ? rawEpistle
          .split(/\n\s*\n/)
          .map((p: string) => p.trim())
          .filter(Boolean)
          .map((text: string, i: number) => ({
            id: `epistle-part-${i + 1}`,
            text,
          }))
      : (celebration.epistleParagraphs || []);

    const loaderPhotos = celebration.loaderPhotos || [];
    const galleryPhotos = celebration.photos || [];
    const voiceAudioUrl = celebration.voiceAudioUrl || '';

    // 1. Store voice recording in dedicated subdocument if present (preserves 1MB safety)
    if (voiceAudioUrl) {
      try {
        await setDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'voice'), {
          audioUrl: voiceAudioUrl,
          duration: celebration.voiceDuration || 0,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Voice subdocument save note:', err);
      }
    }

    // 2. Store photos in subdocuments
    if (loaderPhotos.length > 0) {
      try {
        await setDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'loader'), {
          photos: loaderPhotos,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Loader subdocument save note:', err);
      }
    }

    if (galleryPhotos.length > 0) {
      try {
        await setDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'gallery'), {
          photos: galleryPhotos,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Gallery subdocument save note:', err);
      }
    }

    // 3. Prepare root document payload
    const rootPayload: any = {
      id: cleanId,
      userId: celebration.userId || 'anonymous',
      userEmail: celebration.userEmail || '',
      recipientName: celebration.recipientName || 'Celebrant',
      nickname: celebration.nickname || celebration.recipientName || '',
      occasion: celebration.occasion || 'birthday',
      letterType: celebration.letterType || 'both',
      epistleText: rawEpistle,
      epistleParagraphs: normalizedParas,
      hasVoice: Boolean(voiceAudioUrl),
      voiceDuration: celebration.voiceDuration || 0,
      soundtrackPreset: celebration.soundtrackPreset || 'none',
      customAudioUrl: celebration.customAudioUrl || '',
      openingTitle: celebration.openingTitle || `For ${celebration.recipientName} ❤️`,
      openingSubtitle: celebration.openingSubtitle || 'A handwritten letter, captured moments, and eternal celebration.',
      finaleTitle: celebration.finaleTitle || 'Forever Celebrating You',
      finaleExactMessage: celebration.finaleExactMessage || 'HAPPPYYYYYYY BIRTHDAYYYYYYYYY🤭🤗🎉',
      videos: celebration.videos || [],
      updatedAt: new Date().toISOString(),
      createdAt: celebration.createdAt || new Date().toISOString(),
    };

    // Keep root slim if photos are bulky
    const testString = JSON.stringify({ ...rootPayload, loaderPhotos, photos: galleryPhotos });
    if (testString.length < 300000) {
      rootPayload.loaderPhotos = loaderPhotos;
      rootPayload.photos = galleryPhotos;
    } else {
      rootPayload.loaderPhotos = [];
      rootPayload.photos = [];
    }

    const docRef = doc(db, CELEBRATIONS_COLLECTION, cleanId);
    await setDoc(docRef, rootPayload, { merge: true });

    // Increment user's celebration count if userId is provided
    if (celebration.userId && celebration.userId !== 'anonymous') {
      try {
        const uRef = doc(db, USERS_COLLECTION, celebration.userId);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const uData = uSnap.data();
          await setDoc(uRef, {
            celebrationsCount: (uData.celebrationsCount || 0) + 1,
            lastLoginAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (uErr) {
        console.warn('User stats update note:', uErr);
      }
    }

    console.log(`[API] Saved celebration '${cleanId}' successfully!`);
    return res.json({
      success: true,
      id: cleanId,
      data: {
        ...rootPayload,
        loaderPhotos,
        photos: galleryPhotos,
        voiceAudioUrl,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/celebration:', err);
    return res.status(500).json({ error: err.message || 'Failed to save celebration' });
  }
});

// DELETE /api/celebration/:id - Delete celebration with authorization check
app.delete('/api/celebration/:id', async (req, res) => {
  try {
    const rawId = req.params.id.trim().toLowerCase();
    const cleanId = rawId.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const requesterUserId = (req.headers['x-user-id'] as string || '').trim();
    const requesterEmail = (req.headers['x-user-email'] as string || '').toLowerCase().trim();

    const docRef = doc(db, CELEBRATIONS_COLLECTION, cleanId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const isOwner = requesterUserId && data.userId === requesterUserId;
      const isSuperAdmin = requesterEmail === SUPER_ADMIN_EMAIL.toLowerCase();

      // Only allow owner or super admin to delete
      if (!isOwner && !isSuperAdmin) {
        return res.status(403).json({ error: 'forbidden', message: 'You do not have permission to delete this celebration' });
      }
    }

    await deleteDoc(docRef);

    // Clean up subdocs if possible
    try {
      await deleteDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'loader'));
      await deleteDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'gallery'));
      await deleteDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'voice'));
    } catch {}

    return res.json({ success: true, id: cleanId });
  } catch (err: any) {
    console.error(`Error in DELETE /api/celebration/${req.params.id}:`, err);
    return res.status(500).json({ error: err.message || 'Failed to delete celebration' });
  }
});

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eyan mi platform server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
