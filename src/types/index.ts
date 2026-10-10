export type LetterType = 'typed' | 'voice' | 'both';
export type SoundtrackPreset = 'none' | 'acoustic-piano' | 'lofi-sunset' | 'cinematic-strings' | 'golden-harp' | 'custom';
export type OccasionType = 'birthday' | 'anniversary' | 'appreciation' | 'love' | 'just-because';

export interface EpistleParagraph {
  id: string;
  text: string;
  startTime?: number; // In seconds
  endTime?: number;   // In seconds
  note?: string;      // Optional subtle note
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  tag?: string;
  date?: string;
  location?: string;
  rotation?: number;  // Scrapbook tilt (-3 to +3 degrees)
  tapeColor?: 'blush' | 'gold' | 'rose';
  aspectRatio?: 'portrait' | 'square' | 'landscape';
}

export interface VideoMemory {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  duration?: string;
}

export interface LoveNote {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  color?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  role: 'admin' | 'user';
  celebrationsCount: number;
}

export interface CelebrationConfig {
  id: string;
  userId?: string;
  userEmail?: string;
  recipientName: string;
  nickname: string;
  occasion?: OccasionType | string;
  letterType?: LetterType;
  openingTitle: string;
  openingSubtitle: string;
  finaleTitle: string;
  finaleExactMessage: string;
  epistleText?: string;          // Continuous single handwritten epistle text
  epistleParagraphs: EpistleParagraph[];
  voiceAudioUrl?: string;       // User recorded personal voice reading or uploaded audio
  voiceDuration?: number;        // Voice recording duration in seconds
  soundtrackPreset?: SoundtrackPreset; // User selected ambient background music
  customAudioUrl?: string;       // Custom audio URL if soundtrackPreset is 'custom'
  synchronizedTimingAvailable?: boolean;
  loaderPhotos: GalleryPhoto[]; // Images for the animated opening loader
  photos: GalleryPhoto[];       // Images for the scrapbook gallery
  videos?: VideoMemory[];
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields kept for compatibility
  audioNarrationUrl?: string;
  audioTitle?: string;
  audioNarrator?: string;
  autoReadVoice?: boolean;
  voicePitch?: number;
  voiceRate?: number;
  voiceName?: string;
}
