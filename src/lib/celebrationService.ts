import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { CelebrationConfig, GalleryPhoto, UserProfile } from '../types';
import { INITIAL_CELEBRATION_CONFIG } from '../data/celebrationConfig';

const CELEBRATIONS_COLLECTION = 'celebrations';
const USERS_COLLECTION = 'users';

const withTimeout = <T>(promise: Promise<T>, ms = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    ),
  ]);
};

function normalizeCelebrantData(data: any, cleanId: string, cachedData?: any): CelebrationConfig {
  const loaderPhotos: GalleryPhoto[] =
    Array.isArray(data.loaderPhotos) && data.loaderPhotos.length > 0
      ? data.loaderPhotos
      : cachedData?.loaderPhotos || [];

  const galleryPhotos: GalleryPhoto[] =
    Array.isArray(data.photos) && data.photos.length > 0
      ? data.photos
      : cachedData?.photos || [];

  const epistleRaw = typeof data.epistleText === 'string' ? data.epistleText.trim() : '';
  const paragraphsRaw = Array.isArray(data.epistleParagraphs) && data.epistleParagraphs.length > 0
    ? data.epistleParagraphs
    : (cachedData?.epistleParagraphs || []);

  const finalEpistleText =
    epistleRaw ||
    (paragraphsRaw.length > 0
      ? paragraphsRaw.map((p: any) => p.text).join('\n\n')
      : (cleanId === 'precious' ? INITIAL_CELEBRATION_CONFIG.epistleText : ''));

  const finalParagraphs = finalEpistleText
    ? finalEpistleText
        .split(/\n\s*\n/)
        .map((p: string) => p.trim())
        .filter(Boolean)
        .map((text: string, i: number) => ({
          id: `epistle-part-${i + 1}`,
          text,
        }))
    : (paragraphsRaw.length > 0 ? paragraphsRaw : INITIAL_CELEBRATION_CONFIG.epistleParagraphs);

  return {
    id: cleanId,
    userId: data.userId || 'anonymous',
    userEmail: data.userEmail || '',
    recipientName: data.recipientName || 'Celebrant',
    nickname: data.nickname || data.recipientName || 'My Person',
    occasion: data.occasion || 'birthday',
    letterType: data.letterType || (data.voiceAudioUrl ? 'both' : 'typed'),
    openingTitle: data.openingTitle || `For ${data.recipientName || 'You'} ❤️`,
    openingSubtitle: data.openingSubtitle || 'A handwritten letter, captured moments, and eternal celebration.',
    finaleTitle: data.finaleTitle || 'Forever Celebrating You',
    finaleExactMessage: data.finaleExactMessage || 'HAPPPYYYYYYY BIRTHDAYYYYYYYYY🤭🤗🎉',
    epistleText: finalEpistleText,
    epistleParagraphs: finalParagraphs,
    voiceAudioUrl: data.voiceAudioUrl || '',
    voiceDuration: data.voiceDuration || 0,
    soundtrackPreset: data.soundtrackPreset || 'none',
    customAudioUrl: data.customAudioUrl || '',
    loaderPhotos: loaderPhotos,
    photos: galleryPhotos,
    videos: data.videos || [],
    viewsCount: data.viewsCount || 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export const celebrationService = {
  /**
   * Fetch single celebration
   */
  async getCelebration(id: string): Promise<CelebrationConfig | null> {
    const cleanId = id.trim().toLowerCase();

    // Check local cache & preview draft
    let cachedData: any = null;
    try {
      const cachedStr = localStorage.getItem(`celebration_${cleanId}`);
      if (cachedStr) {
        cachedData = JSON.parse(cachedStr);
      }
    } catch {}

    if (!cachedData) {
      try {
        const previewDraftStr = sessionStorage.getItem('eyanmi_preview_draft');
        if (previewDraftStr) {
          const parsed = JSON.parse(previewDraftStr);
          if (parsed && parsed.id && parsed.id.trim().toLowerCase() === cleanId) {
            cachedData = parsed;
          }
        }
      } catch {}
    }

    // 1. Try server API
    try {
      const res = await withTimeout(fetch(`/api/celebration/${encodeURIComponent(cleanId)}`), 3500);
      if (res.ok) {
        const apiData = await res.json();
        const normalized = normalizeCelebrantData(apiData, cleanId, cachedData);
        try {
          localStorage.setItem(`celebration_${cleanId}`, JSON.stringify(normalized));
        } catch {}
        return normalized;
      }
    } catch (apiErr) {
      console.warn('Server API read note:', apiErr);
    }

    // 2. Direct Firestore fallback
    try {
      const celebRef = doc(db, CELEBRATIONS_COLLECTION, cleanId);
      const snapshot = await withTimeout(getDoc(celebRef), 4000);

      if (!snapshot.exists()) {
        if (cachedData) return cachedData;
        if (cleanId === 'precious') {
          return INITIAL_CELEBRATION_CONFIG;
        }
        return null;
      }

      const data = snapshot.data();
      const result = normalizeCelebrantData(data, cleanId, cachedData);

      // Check subdocuments for media
      try {
        if (result.photos.length === 0) {
          const gallerySnap = await getDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'gallery'));
          if (gallerySnap.exists() && gallerySnap.data().photos) {
            result.photos = gallerySnap.data().photos;
          }
        }
        if (result.loaderPhotos.length === 0) {
          const loaderSnap = await getDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'loader'));
          if (loaderSnap.exists() && loaderSnap.data().photos) {
            result.loaderPhotos = loaderSnap.data().photos;
          }
        }
        if (!result.voiceAudioUrl) {
          const voiceSnap = await getDoc(doc(db, CELEBRATIONS_COLLECTION, cleanId, 'media', 'voice'));
          if (voiceSnap.exists() && voiceSnap.data().audioUrl) {
            result.voiceAudioUrl = voiceSnap.data().audioUrl;
            result.voiceDuration = voiceSnap.data().duration || 0;
          }
        }
      } catch {}

      return result;
    } catch (err) {
      console.warn('Firestore client read notice:', err);
      if (cachedData) return cachedData;
      if (cleanId === 'precious') {
        return INITIAL_CELEBRATION_CONFIG;
      }
      return null;
    }
  },

  /**
   * Save celebration (supports Node server chunking with direct Firestore fallback for Netlify)
   */
  async saveCelebration(celebration: CelebrationConfig): Promise<void> {
    const cleanId =
      (celebration.id || celebration.recipientName)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'celebrant';

    const payload = {
      ...celebration,
      id: cleanId,
    };

    // Cache locally
    try {
      localStorage.setItem(`celebration_${cleanId}`, JSON.stringify(payload));
    } catch {}

    // 1. Try server API
    try {
      const res = await withTimeout(
        fetch('/api/celebration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        6000
      );

      if (res.ok) {
        return;
      }
    } catch (e) {
      console.warn('Server API save note, falling back to direct Firestore (Netlify/client mode):', e);
    }

    // 2. Direct Firestore fallback (essential for Netlify static hosting)
    try {
      const celebRef = doc(db, CELEBRATIONS_COLLECTION, cleanId);
      await setDoc(celebRef, payload, { merge: true });
    } catch (firestoreErr: any) {
      console.error('Firestore client save failed:', firestoreErr);
      throw new Error(firestoreErr.message || 'Failed to save celebration to cloud database');
    }
  },

  /**
   * Fetch all celebrations (optional userId filter)
   */
  async getAllCelebrations(userId?: string): Promise<CelebrationConfig[]> {
    const url = userId ? `/api/celebrations?userId=${encodeURIComponent(userId)}` : '/api/celebrations';
    try {
      const res = await withTimeout(fetch(url), 4000);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          return list.map((item) => normalizeCelebrantData(item, item.id));
        }
      }
    } catch (e) {
      console.warn('Server API celebrations fetch notice:', e);
    }

    // Direct Firestore fallback
    try {
      const colRef = collection(db, CELEBRATIONS_COLLECTION);
      let snapshot;
      if (userId) {
        const q = query(colRef, where('userId', '==', userId));
        snapshot = await getDocs(q);
      } else {
        snapshot = await getDocs(colRef);
      }

      const list: CelebrationConfig[] = [];
      snapshot.forEach((d) => {
        list.push(normalizeCelebrantData(d.data(), d.id));
      });
      return list;
    } catch (err) {
      console.error('Firestore client fetch celebrations failed:', err);
      return [];
    }
  },

  /**
   * Delete celebration with ownership headers
   */
  async deleteCelebration(id: string, requester?: { userId?: string; userEmail?: string }): Promise<void> {
    const cleanId = id.trim().toLowerCase();
    try {
      const headers: Record<string, string> = {};
      if (requester?.userId) headers['x-user-id'] = requester.userId;
      if (requester?.userEmail) headers['x-user-email'] = requester.userEmail;

      await fetch(`/api/celebration/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
        headers,
      });
    } catch (e) {
      console.warn('Server delete note:', e);
    }

    try {
      const celebRef = doc(db, CELEBRATIONS_COLLECTION, cleanId);
      await deleteDoc(celebRef);
      localStorage.removeItem(`celebration_${cleanId}`);
    } catch {}
  },

  /**
   * Super Admin: Fetch all registered users
   */
  async getAllUsers(adminEmail?: string): Promise<UserProfile[]> {
    try {
      const headers: Record<string, string> = {};
      if (adminEmail) {
        headers['x-admin-email'] = adminEmail;
      }
      const res = await withTimeout(fetch('/api/users', { headers }), 5000);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API users fetch error:', e);
    }

    // Direct client fallback
    try {
      const usersCol = collection(db, USERS_COLLECTION);
      const snap = await getDocs(usersCol);
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      return list;
    } catch (err) {
      console.error('Firestore fetch users failed:', err);
      return [];
    }
  },

  /**
   * Eyan Mi AI Epistle Co-Writer - Generates poetic personalized text with fail-safe engine
   */
  async generateAIEpistle(params: {
    recipientName: string;
    nickname?: string;
    relationship?: string;
    occasion?: string;
    memoriesAndTraits?: string;
    tone?: string;
  }): Promise<string> {
    const dearName = params.nickname || params.recipientName;

    // 1. First attempt server-side Gemini endpoint with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.letter && typeof data.letter === 'string' && data.letter.trim().length > 30) {
          return data.letter.trim();
        }
      }
    } catch (err) {
      console.warn('Backend /api/generate-letter notice, engaging Eyan Mi AI Epistle engine:', err);
    }

    // 2. High-fidelity Eyan Mi AI Epistle lyrical engine (Guaranteed never to fail)
    return generatePoeticEpistle(params);
  },

  /**
   * Shorten celebrant delivery link using backend proxy & free public shortener service
   */
  async shortenCelebrantLink(longUrl: string): Promise<string> {
    // 1. Try backend proxy first (bypasses browser CORS)
    try {
      const res = await withTimeout(
        fetch('/api/shorten-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: longUrl }),
        }),
        4500
      );
      if (res.ok) {
        const data = await res.json();
        if (data.shortUrl && typeof data.shortUrl === 'string' && data.shortUrl.startsWith('http') && data.shortUrl !== longUrl) {
          return data.shortUrl.trim();
        }
      }
    } catch (e) {
      console.warn('Backend shorten proxy notice:', e);
    }

    // 2. Direct client fallback attempt
    try {
      const encoded = encodeURIComponent(longUrl);
      const res = await withTimeout(
        fetch(`https://tinyurl.com/api-create.php?url=${encoded}`),
        3500
      );
      if (res.ok) {
        const short = await res.text();
        if (short.startsWith('http')) {
          return short.trim();
        }
      }
    } catch (e) {
      console.warn('TinyURL client notice:', e);
    }

    // 3. Fallback attempt with is.gd
    try {
      const encoded = encodeURIComponent(longUrl);
      const res = await withTimeout(
        fetch(`https://is.gd/create.php?format=simple&url=${encoded}`),
        3500
      );
      if (res.ok) {
        const short = await res.text();
        if (short.startsWith('http')) {
          return short.trim();
        }
      }
    } catch (e) {
      console.warn('is.gd shortener notice:', e);
    }

    return longUrl;
  },
};

/**
 * Built-in High Fidelity Eyan Mi AI Epistle Generation Engine
 */
function generatePoeticEpistle(params: {
  recipientName: string;
  nickname?: string;
  relationship?: string;
  occasion?: string;
  memoriesAndTraits?: string;
  tone?: string;
}): string {
  const name = params.recipientName.trim();
  const dear = (params.nickname || name).trim();
  const occasion = (params.occasion || 'this special celebration').trim();
  const rel = (params.relationship || 'my cherished person').trim();
  const tone = params.tone || 'deeply-emotional';
  const traits = params.memoriesAndTraits ? params.memoriesAndTraits.trim() : '';

  let address = `My dearest ${dear},`;
  let signoff = `Yours endlessly and completely,\nForever in your corner.`;

  let p1 = `Today, the noise of the world softens, making room for the one truth that matters most: celebrating the wonder that is you. You are more than just ${rel}; you are a quiet sanctuary in a restless world, a light that illuminates every space you step into.`;

  let p2 = traits
    ? `Whenever I think of you, I am reminded of ${traits}. It is in those rare, unrepeatable moments that your true heart shines—pure, steadfast, and breathtakingly generous.`
    : `There is a gentle rhythm to the way you move through life, giving so freely of your grace and kindness without ever asking for applause. Simply knowing you exist makes the world feel infinitely warmer and safer.`;

  let p3 = `Your laughter has an effortless way of lifting the heaviest shadows, turning ordinary minutes into sacred memories. Thank you for being the person who never wavers, who loves with wholehearted conviction, and who reminds me what true loyalty and unconditional affection look like.`;

  let p4 = `On this beautiful celebration of your ${occasion}, my deepest prayer is that all the love, peace, and beauty you have poured into everyone around you returns to you a thousandfold. May this year open doors you never dreamed of and wrap your heart in boundless joy.`;

  if (tone === 'romantic') {
    address = `To the love of my life, my ${dear},`;
    p1 = `Loving you is the easiest, most sacred truth I will ever know. Long before words could capture it, my soul recognized yours—not as a passing chapter, but as home. On this special celebration of you, every beat of my heart is a love letter written in your honor.`;
    p3 = `In your eyes, I found stillness. In your arms, I found safety. Thank you for choosing me, for loving me through every season, and for making life feel like poetry set in motion.`;
    signoff = `With every breath and all the love I possess,\nYours for this lifetime and all that follow.`;
  } else if (tone === 'playful') {
    address = `To my favorite human, ${dear}!`;
    p1 = `If they gave out awards for being the coolest, most chaotic good human on the planet, you would take first place every single year without contest!`;
    p3 = `Thank you for the inside jokes, the ridiculous laughs that leave us gasping for air, and for never letting me do crazy things alone. You are one of a kind!`;
    signoff = `With endless laughs and huge love,\nYour partner-in-crime forever.`;
  } else if (tone === 'tear-jerker') {
    address = `My precious ${dear},`;
    p1 = `I sat down to write this and found tears filling my eyes—not of sorrow, but of sheer, overwhelming gratitude that God gave this world you, and gave me the honor of loving you.`;
    p3 = `You have carried others through storms when your own hands were trembling. You have given pieces of your heart to make sure others remained whole. You deserve to be celebrated not just today, but every single day that the sun rises.`;
    signoff = `Bound by eternal love and gratitude,\nAlways beside you.`;
  }

  return `${address}\n\n${p1}\n\n${p2}\n\n${p3}\n\n${p4}\n\n${signoff}`;
}
