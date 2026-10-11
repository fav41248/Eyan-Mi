/**
 * Eyan mi · Luxury Digital Celebration Platform
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { INITIAL_CELEBRATION_CONFIG } from './data/celebrationConfig';
import { CelebrationConfig } from './types';
import { celebrationService } from './lib/celebrationService';
import { soundtrackEngine } from './utils/audioEngine';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { CelebrationStudio } from './components/CelebrationStudio';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AuthModal } from './components/AuthModal';
import { PhotoLoader } from './components/PhotoLoader';
import { BirthdayEnvelopeExperience } from './components/BirthdayEnvelopeExperience';
import { ConfettiHeartsCanvas } from './components/ConfettiHeartsCanvas';
import { KeepsakeExportModal } from './components/KeepsakeExportModal';
import { ScheduledLockScreen } from './components/ScheduledLockScreen';
import { Volume2, VolumeX, Heart, Sparkles, Eye, Printer, Download, Lock, Unlock } from 'lucide-react';

type AppView = 'landing' | 'dashboard' | 'studio' | 'admin' | 'celebration';

function MainApp() {
  const { user, userProfile, isAdmin } = useAuth();

  // Route state
  const [view, setView] = useState<AppView>('landing');
  const [celebrantId, setCelebrantId] = useState<string | null>(null);
  const [editingCelebration, setEditingCelebration] = useState<CelebrationConfig | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Celebrant Experience State
  const [config, setConfig] = useState<CelebrationConfig>(INITIAL_CELEBRATION_CONFIG);
  const [isLoadingCelebrant, setIsLoadingCelebrant] = useState(false);
  const [step, setStep] = useState<'loader' | 'celebration'>('loader');
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isScheduledUnlocked, setIsScheduledUnlocked] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [isMuted, setIsMuted] = useState(() => soundtrackEngine.isMuted());
  const [keepsakeModalOpen, setKeepsakeModalOpen] = useState(false);

  // Parse URL on mount and url changes (supports query params, clean path /c/name, and hash routes)
  const parseUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    let extractedCelebrant = params.get('c') || params.get('celebrant');

    if (!extractedCelebrant) {
      if (pathname.startsWith('/c/')) {
        extractedCelebrant = pathname.slice(3).split('/')[0];
      } else if (pathname.startsWith('/to/')) {
        extractedCelebrant = pathname.slice(4).split('/')[0];
      } else if (pathname.startsWith('/for/')) {
        extractedCelebrant = pathname.slice(5).split('/')[0];
      } else if (hash.startsWith('#/c/')) {
        extractedCelebrant = hash.slice(4).split('?')[0];
      } else if (hash.startsWith('#/') && hash.length > 2 && !hash.includes('admin') && !hash.includes('dashboard')) {
        extractedCelebrant = hash.slice(2).split('?')[0];
      } else if (
        pathname.length > 1 &&
        !['/', '/dashboard', '/studio', '/admin', '/login'].includes(pathname) &&
        !pathname.includes('.')
      ) {
        // Direct clean slug e.g. /oluwa
        extractedCelebrant = pathname.replace(/^\//, '').split('/')[0];
      }
    }

    const viewParam = params.get('view');
    const isAdminParam =
      params.get('admin') === 'true' ||
      hash.includes('admin') ||
      pathname.includes('/admin') ||
      viewParam === 'admin';

    const isPreviewParam = params.get('preview') === 'true';
    if (isPreviewParam) {
      setIsPreviewMode(true);
    }

    if (isAdminParam) {
      setView('admin');
    } else if (extractedCelebrant) {
      setCelebrantId(decodeURIComponent(extractedCelebrant));
      setView('celebration');
    } else if (viewParam === 'dashboard' || viewParam === 'mystudio' || pathname === '/dashboard') {
      setView('dashboard');
    } else if (viewParam === 'studio' || viewParam === 'create' || pathname === '/studio') {
      setView('studio');
    } else {
      setView('landing');
    }
  };

  useEffect(() => {
    parseUrl();
    window.addEventListener('popstate', parseUrl);
    window.addEventListener('hashchange', parseUrl);
    return () => {
      window.removeEventListener('popstate', parseUrl);
      window.removeEventListener('hashchange', parseUrl);
    };
  }, []);

  // Update URL helper
  const navigateTo = (newView: AppView, newCelebrantId?: string) => {
    setView(newView);
    const url = new URL(window.location.href);

    if (newView === 'celebration' && newCelebrantId) {
      setCelebrantId(newCelebrantId);
      url.searchParams.set('c', newCelebrantId);
      url.searchParams.delete('view');
      url.searchParams.delete('admin');
    } else if (newView === 'admin') {
      url.searchParams.set('view', 'admin');
      url.searchParams.delete('c');
    } else if (newView === 'dashboard') {
      url.searchParams.set('view', 'dashboard');
      url.searchParams.delete('c');
      url.searchParams.delete('admin');
    } else if (newView === 'studio') {
      url.searchParams.set('view', 'studio');
      url.searchParams.delete('c');
      url.searchParams.delete('admin');
    } else {
      // Landing
      url.searchParams.delete('c');
      url.searchParams.delete('view');
      url.searchParams.delete('admin');
    }

    window.history.pushState({}, '', url.toString());
  };

  // Stop soundtrack when navigating away from celebrant view
  useEffect(() => {
    if (view !== 'celebration') {
      soundtrackEngine.stop();
    }
  }, [view]);

  // Load celebration data when viewing celebrant experience
  useEffect(() => {
    if (view === 'celebration' && celebrantId) {
      // If previewing a draft that matches this celebrantId, preserve the draft in config
      if (isPreviewMode && config && config.id && config.id.toLowerCase() === celebrantId.toLowerCase()) {
        setIsLoadingCelebrant(false);
        return;
      }

      let isMounted = true;
      setIsLoadingCelebrant(true);
      setIsScheduledUnlocked(false);
      setStep('loader');
      setIsEnvelopeOpen(false);

      const load = async () => {
        try {
          let data = await celebrationService.getCelebration(celebrantId);
          if (
            (!data || data.epistleText === INITIAL_CELEBRATION_CONFIG.epistleText) &&
            celebrantId === 'precious'
          ) {
            const alt = await celebrationService.getCelebration('oluwapreciousimi');
            if (alt && alt.epistleText && alt.epistleText !== INITIAL_CELEBRATION_CONFIG.epistleText) {
              data = alt;
            }
          }

          if (isMounted) {
            if (data) {
              setConfig(data);
            } else {
              const cleanName = celebrantId.replace(/[-_]/g, ' ').trim();
              const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
              setConfig({
                ...INITIAL_CELEBRATION_CONFIG,
                id: celebrantId,
                recipientName: formattedName,
                nickname: formattedName,
                openingTitle: `For ${formattedName} ❤️`,
                finaleExactMessage: `HAPPY BIRTHDAY ${formattedName.toUpperCase()}! 🥂✨`,
                epistleText: `Dearest ${formattedName}, wishing you a truly wonderful celebration filled with immense love, joy, and peace!`,
                epistleParagraphs: [
                  {
                    id: 'para-1',
                    text: `Dearest ${formattedName}, wishing you a truly wonderful celebration filled with immense love, joy, and peace!`,
                  },
                ],
              });
            }
          }
        } catch (err) {
          console.error('Error fetching celebration:', err);
        } finally {
          if (isMounted) setIsLoadingCelebrant(false);
        }
      };

      load();
      return () => {
        isMounted = false;
      };
    }
  }, [view, celebrantId, isPreviewMode]);

  // Handle "Create Celebration" click from landing page
  const handleStartCreating = () => {
    if (!user && !userProfile) {
      setAuthModalOpen(true);
    } else {
      setEditingCelebration(null);
      navigateTo('studio');
    }
  };

  // 1. CELEBRANT EXPERIENCE VIEW
  if (view === 'celebration') {
    if (isLoadingCelebrant) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-12 h-12 rounded-full border-3 border-[#E5D2C5] border-t-[#8B1E3F] animate-spin mb-4" />
          <p className="font-serif italic text-base text-[#6E4F57]">
            Opening your celebration...
          </p>
        </div>
      );
    }

    const isCurrentlyLocked = Boolean(
      config.isScheduledUnlock &&
      config.unlockAt &&
      !isScheduledUnlocked &&
      new Date(config.unlockAt).getTime() > Date.now()
    );

    if (isCurrentlyLocked) {
      return (
        <div className="relative min-h-screen bg-[#1F0A12] text-white">
          <ConfettiHeartsCanvas burstTrigger={burstTrigger} interactive={false} />

          {/* Live Creator Draft Preview Banner for Locked Screen */}
          {isPreviewMode && (
            <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-1.5 sm:gap-4 bg-[#4A1525]/95 text-white backdrop-blur-md px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-2xl border border-[#D4AF37]/40 text-xs animate-fade-in max-w-[96vw]">
              <div className="flex items-center gap-1 font-medium truncate min-w-0">
                <Lock className="w-3.5 h-3.5 text-[#FFD782] shrink-0" />
                <span className="truncate text-[11px] sm:text-xs text-[#FFE8B8]">
                  Locked Preview: <strong>{config.recipientName || 'Celebrant'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduledUnlocked(true);
                    setBurstTrigger((prev) => prev + 1);
                  }}
                  className="px-2.5 sm:px-3 py-1 bg-[#8B1E3F] hover:bg-[#A6244A] text-white rounded-full text-[10px] sm:text-[11px] font-bold transition-colors cursor-pointer border border-[#FF94AB]/40 shadow-xs flex items-center gap-1"
                >
                  <Unlock className="w-3 h-3 text-[#FFD782]" />
                  <span>Preview Unlocked</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundtrackEngine.stop();
                    setIsPreviewMode(false);
                    setView('studio');
                  }}
                  className="px-2.5 sm:px-3.5 py-1 bg-white text-[#8B1E3F] hover:bg-[#FFF0F2] rounded-full font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer shadow-xs"
                >
                  ✏️ <span className="hidden sm:inline">Back to Editor</span><span className="sm:hidden">Edit</span>
                </button>
              </div>
            </div>
          )}

          <ScheduledLockScreen
            config={config}
            isPreview={isPreviewMode}
            onUnlock={() => {
              setIsScheduledUnlocked(true);
              setBurstTrigger((prev) => prev + 1);
            }}
          />
        </div>
      );
    }

    const loaderPhotosToDisplay =
      config.loaderPhotos && config.loaderPhotos.length > 0
        ? config.loaderPhotos
        : config.photos;

    return (
      <div className="relative min-h-screen bg-[#FAF7F2] text-[#241318] overflow-x-hidden selection:bg-[#FCE8EB] selection:text-[#8B1E3F]">
        <ConfettiHeartsCanvas burstTrigger={burstTrigger} interactive={true} />

        {/* Live Creator Draft Preview Banner */}
        {isPreviewMode && (
          <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-1.5 sm:gap-4 bg-[#4A1525]/95 text-white backdrop-blur-md px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-2xl border border-white/20 text-xs animate-fade-in max-w-[96vw]">
            <div className="flex items-center gap-1 font-medium truncate min-w-0">
              <Eye className="w-3.5 h-3.5 text-[#E5D2C5] shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">
                Draft: <strong>{config.recipientName || 'Celebrant'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {config.isScheduledUnlock && config.unlockAt && (
                <button
                  type="button"
                  onClick={() => setIsScheduledUnlocked(false)}
                  className="px-2 sm:px-2.5 py-1 bg-white/20 hover:bg-white/30 text-[#FFD7DF] rounded-full text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Switch to viewing the locked countdown screen"
                >
                  ⏳ Lock Screen
                </button>
              )}
              {step === 'loader' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('celebration');
                    if (config.soundtrackPreset && config.soundtrackPreset !== 'none') {
                      soundtrackEngine.start(config.soundtrackPreset, config.customAudioUrl);
                    }
                  }}
                  className="px-2 sm:px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundtrackEngine.stop();
                  setIsPreviewMode(false);
                  setView('studio');
                }}
                className="px-2.5 sm:px-3.5 py-1 bg-white text-[#8B1E3F] hover:bg-[#FFF0F2] rounded-full font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer shadow-xs"
              >
                ✏️ <span className="hidden sm:inline">Back to Editor</span><span className="sm:hidden">Edit</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Animated Opening Loader */}
        {step === 'loader' && (
          <PhotoLoader
            photos={loaderPhotosToDisplay}
            openingTitle={config.openingTitle}
            openingSubtitle={config.openingSubtitle}
            recipientName={config.recipientName}
            onComplete={() => {
              setStep('celebration');
              setBurstTrigger((prev) => prev + 1);
              // Start chosen soundtrack (or silent if none)
              if (config.soundtrackPreset && config.soundtrackPreset !== 'none') {
                soundtrackEngine.start(config.soundtrackPreset, config.customAudioUrl);
              }
            }}
          />
        )}

        {/* STEP 2: The 3D Wax Envelope & Delivery */}
        {step === 'celebration' && (
          <div className="animate-fade-in">
            <BirthdayEnvelopeExperience
              isOpen={isEnvelopeOpen}
              onOpenLetter={() => {
                setIsEnvelopeOpen(true);
                setBurstTrigger((prev) => prev + 1);
                if (config.soundtrackPreset && config.soundtrackPreset !== 'none') {
                  soundtrackEngine.start(config.soundtrackPreset, config.customAudioUrl);
                }
              }}
              recipientName={config.recipientName}
              paragraphs={config.epistleParagraphs}
              epistleText={config.epistleText}
              letterType={config.letterType}
              voiceAudioUrl={config.voiceAudioUrl}
              voiceDuration={config.voiceDuration}
              galleryPhotos={config.photos}
              finaleMessage={config.finaleExactMessage}
              celebrationConfig={config}
              onOpenExportModal={() => setKeepsakeModalOpen(true)}
            />

            {/* Bottom Floating Control Dock - Clean, non-overlapping on all devices */}
            <div className="fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-6 z-40 pointer-events-none flex items-center justify-between gap-2">
              {/* Left Dock: Audio & Export */}
              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                {config.soundtrackPreset && config.soundtrackPreset !== 'none' && (
                  <button
                    type="button"
                    onClick={() => {
                      const muted = soundtrackEngine.toggleMute();
                      setIsMuted(muted);
                    }}
                    className="p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white text-[#4A1525] shadow-md border border-[#EADBDA] backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    title={isMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
                    aria-label={isMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-[#8C6B73]" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#8B1E3F]" />
                    )}
                  </button>
                )}

                {isEnvelopeOpen && (
                  <button
                    type="button"
                    onClick={() => setKeepsakeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 hover:bg-white text-[#8B1E3F] text-xs font-semibold shadow-md border border-[#EADBDA] backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    title="Download or Print Keepsake PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#8B1E3F]" />
                    <span className="hidden sm:inline">Save Keepsake PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                )}
              </div>

              {/* Right Dock: Brand Link */}
              <div className="pointer-events-auto">
                <button
                  type="button"
                  onClick={() => navigateTo('landing')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#8B1E3F] text-xs font-semibold shadow-md border border-[#EADBDA] backdrop-blur-md transition-all cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-[#8B1E3F]" />
                  <span className="hidden sm:inline">Made with Eyan mi</span>
                  <span className="sm:hidden">Eyan mi</span>
                </button>
              </div>
            </div>

            {/* Celebrant High-Quality Keepsake PDF Export Modal */}
            <KeepsakeExportModal
              isOpen={keepsakeModalOpen}
              onClose={() => setKeepsakeModalOpen(false)}
              celebration={config}
              deliveryUrl={
                typeof window !== 'undefined'
                  ? `${window.location.origin}/c/${config.id || celebrantId || 'celebrant'}`
                  : ''
              }
            />
          </div>
        )}
      </div>
    );
  }

  // 2. SUPER ADMIN PANEL VIEW
  if (view === 'admin') {
    return (
      <SuperAdminDashboard
        onBackToApp={() => navigateTo('dashboard')}
        onPreviewCelebration={(id) => navigateTo('celebration', id)}
      />
    );
  }

  // 3. CREATOR STUDIO VIEW
  if (view === 'studio') {
    return (
      <CelebrationStudio
        initialConfig={editingCelebration}
        onExit={() => navigateTo('dashboard')}
        onSaved={(saved) => {
          setEditingCelebration(saved);
        }}
        onPreviewCelebrant={(draft) => {
          setConfig(draft);
          setEditingCelebration(draft);
          setCelebrantId(draft.id);
          setIsPreviewMode(true);
          setIsLoadingCelebrant(false);
          setStep('loader');
          setIsEnvelopeOpen(false);
          setView('celebration');
        }}
      />
    );
  }

  // 4. USER DASHBOARD VIEW
  if (view === 'dashboard') {
    return (
      <UserDashboard
        onCreateNew={() => {
          setEditingCelebration(null);
          navigateTo('studio');
        }}
        onEditCelebration={(c) => {
          setEditingCelebration(c);
          navigateTo('studio');
        }}
        onPreviewCelebration={(id) => navigateTo('celebration', id)}
        onGoToAdmin={() => navigateTo('admin')}
        onGoToLanding={() => navigateTo('landing')}
      />
    );
  }

  // 5. LANDING PAGE VIEW (Default /)
  return (
    <>
      <LandingPage
        onStartCreating={handleStartCreating}
        onOpenSample={() => navigateTo('celebration', 'precious')}
        onGoToDashboard={() => navigateTo('dashboard')}
        onOpenAuth={() => setAuthModalOpen(true)}
        onGoToAdmin={() => navigateTo('admin')}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          navigateTo('dashboard');
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
