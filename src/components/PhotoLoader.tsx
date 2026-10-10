import React, { useState, useEffect, useCallback } from 'react';
import { GalleryPhoto } from '../types';
import { Heart, Sparkles, ChevronRight, ChevronLeft, Play, Pause, Mail, Volume2, VolumeX } from 'lucide-react';
import { romanticAmbientSynth } from '../utils/audioEngine';

interface PhotoLoaderProps {
  photos: GalleryPhoto[];
  openingTitle: string;
  openingSubtitle: string;
  recipientName: string;
  onComplete: () => void;
}

const PHOTO_DURATION_MS = 4000; // Exact 4 seconds per photo

export const PhotoLoader: React.FC<PhotoLoaderProps> = ({
  photos,
  openingTitle,
  openingSubtitle,
  recipientName,
  onComplete,
}) => {
  // Phase 1: 'headline' (shows the lovely romantic headline first - silent)
  // Phase 2: 'photos' (cycles through the 7 to 10 pictures with smooth cross-fade animation & romantic music)
  const [phase, setPhase] = useState<'headline' | 'photos'>('headline');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // Resets the 4-second cycle on tap
  const [isMuted, setIsMuted] = useState(() => romanticAmbientSynth.isMuted());

  // Filter valid photos
  const validPhotos = photos.filter((p) => Boolean(p.url && p.url.trim()));

  // Default captions in case some don't have one
  const defaultCaptions = [
    'The radiant smile that illuminates everything around you',
    'Effortless grace, quiet beauty, and pure confidence',
    'A heart so tender and pure, bringing joy to everyone',
    'Every laugh and shared glance is forever cherished',
    'Unmistakably Precious — gentle, sweet, and deeply adored',
    'Your presence turns any ordinary moment into magic',
    'A light that shines brighter with every passing year',
    'Breathtaking in every glance, admired in every breath',
    'To the one who makes this world so much more beautiful',
    'Forever my favorite celebration — Happy Birthday!',
  ];

  const displayPhotos = validPhotos.map((p, i) => ({
    ...p,
    caption: p.caption || defaultCaptions[i % defaultCaptions.length],
  }));

  const hasPhotos = displayPhotos.length > 0;

  // The romantic sound ONLY starts playing once the images start showing (Phase 2)
  useEffect(() => {
    if (phase === 'photos') {
      romanticAmbientSynth.start();

      // Ensure audio unlock on touch / tap if browser requires gesture
      const unlockOnTouch = () => {
        romanticAmbientSynth.start();
        window.removeEventListener('click', unlockOnTouch);
        window.removeEventListener('touchstart', unlockOnTouch);
      };
      window.addEventListener('click', unlockOnTouch);
      window.addEventListener('touchstart', unlockOnTouch);

      return () => {
        window.removeEventListener('click', unlockOnTouch);
        window.removeEventListener('touchstart', unlockOnTouch);
      };
    }
  }, [phase]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = romanticAmbientSynth.toggleMute();
    setIsMuted(muted);
  };

  // Phase 1 timer: after 4.2 seconds, automatically transition from headline to photos (or complete if no photos)
  useEffect(() => {
    if (phase !== 'headline') return;

    const timer = setTimeout(() => {
      if (hasPhotos) {
        setPhase('photos');
      } else {
        romanticAmbientSynth.start();
        onComplete();
      }
    }, 4200);

    return () => clearTimeout(timer);
  }, [phase, hasPhotos, onComplete]);

  // Navigate to Next Photo
  const handleNextPhoto = useCallback(() => {
    romanticAmbientSynth.start();
    if (currentIndex < displayPhotos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimerKey((k) => k + 1);
    } else {
      onComplete();
    }
  }, [currentIndex, displayPhotos.length, onComplete]);

  // Navigate to Previous Photo
  const handlePrevPhoto = useCallback(() => {
    romanticAmbientSynth.start();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setTimerKey((k) => k + 1);
    }
  }, [currentIndex]);

  // Phase 2 timer: 4 SECONDS per photo
  useEffect(() => {
    if (phase !== 'photos' || isPaused || !hasPhotos) return;

    const timer = setTimeout(() => {
      handleNextPhoto();
    }, PHOTO_DURATION_MS);

    return () => clearTimeout(timer);
  }, [phase, currentIndex, isPaused, hasPhotos, timerKey, handleNextPhoto]);

  // ================= PHASE 1: LOVELY HEADLINE FIRST (SILENT) =================
  if (phase === 'headline') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F0A12] text-white overflow-hidden px-4">
        {/* Soft background ambient glow */}
        <div className="absolute inset-0 bg-radial from-[#8B1E3F]/40 via-transparent to-black pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-xl w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-1000 py-12">
          {/* Subtle Glowing Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFD7DF] text-xs font-medium tracking-widest uppercase shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687] animate-pulse" />
            <span>A Special Birthday Dedication</span>
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687] animate-pulse" />
          </div>

          {/* The Lovely Opening Headline (Editable in Admin) */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#FFF5F6] leading-[1.15] drop-shadow-md">
            {openingTitle || `For My Beloved ${recipientName} ❤️`}
          </h1>

          {/* The Lovely Subtitle / Message (Editable in Admin) */}
          <p className="font-serif text-sm sm:text-base md:text-lg text-[#E8C5CE] leading-relaxed max-w-md mx-auto italic font-light">
            {openingSubtitle ||
              'Before you unseal your handwritten birthday letter, take a moment to look at these captured memories of you...'}
          </p>

          {/* Quick Action Button to start photos or skip directly */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {hasPhotos ? (
              <button
                type="button"
                onClick={() => {
                  setPhase('photos');
                  romanticAmbientSynth.start();
                }}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#8B1E3F] to-[#B32752] text-white text-xs font-semibold tracking-wider uppercase shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-[#FF94AB]/30"
              >
                <span>View Memories ({displayPhotos.length} Photos)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                romanticAmbientSynth.start();
                onComplete();
              }}
              className="text-xs text-[#E8C5CE]/80 hover:text-white underline underline-offset-4 py-2 transition-colors cursor-pointer"
            >
              Skip directly to Birthday Epistle 💌
            </button>
          </div>

          {/* Progress dots animation */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            <span className="w-2 h-2 rounded-full bg-[#E6C687] animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-[#E6C687] animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-[#E6C687] animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  // ================= PHASE 2: 7 TO 10 PICTURES SEQUENCE WITH SMOOTH CROSS-FADE =================
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#15050C] text-white overflow-hidden p-4 sm:p-6 md:p-8 select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-[#8B1E3F]/30 via-black/80 to-black pointer-events-none" />

      {/* Floating Subtle Ambient Music Mute/Unmute Toggle */}
      <button
        type="button"
        onClick={handleToggleMute}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/90 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
        title={isMuted ? 'Unmute romantic music' : 'Mute romantic music'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-[#FFB3C1]" />
        ) : (
          <Volume2 className="w-4 h-4 text-[#E6C687] animate-pulse" />
        )}
      </button>

      {/* INVISIBLE TAP ZONES: Tapping left side goes to previous photo, tapping right side advances photo */}
      <div
        className="absolute inset-y-16 left-0 w-1/2 z-20 cursor-pointer active:bg-white/[0.04] transition-colors"
        onClick={handlePrevPhoto}
        title="Tap left side to see previous picture"
      />
      <div
        className="absolute inset-y-16 right-0 w-1/2 z-20 cursor-pointer active:bg-white/[0.04] transition-colors"
        onClick={handleNextPhoto}
        title="Tap right side to see next picture"
      />

      {/* Top Header & Progress Bar */}
      <div className="relative z-30 max-w-4xl w-full mx-auto space-y-3 pointer-events-auto pl-12 sm:pl-0">
        {/* Progress indicator segments */}
        <div className="flex items-center gap-1.5 w-full">
          {displayPhotos.map((_, idx) => (
            <div
              key={idx}
              className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/20 transition-all"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx < currentIndex
                    ? 'w-full bg-[#E6C687]'
                    : idx === currentIndex
                    ? 'w-full bg-white animate-pulse'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-[#E8C5CE]">
          <span className="font-serif tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687]" />
            <span>
              Memory {currentIndex + 1} of {displayPhotos.length}
            </span>
          </span>

          <button
            type="button"
            onClick={() => {
              romanticAmbientSynth.start();
              onComplete();
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
          >
            <Mail className="w-3.5 h-3.5 text-[#FFB3C1]" />
            <span>Open Epistle & Letter</span>
          </button>
        </div>
      </div>

      {/* Main Center Photo Card with Smooth Cross-Fade Animation */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-4 pointer-events-none">
        <div className="relative max-w-sm sm:max-w-md w-full bg-[#FAF7F2] text-[#241318] p-3 sm:p-4 rounded-3xl shadow-2xl border-4 border-[#E6C687]/40">
          
          {/* Photo Frame Container with Stacked Cross-Fading Images */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#241318] shadow-inner">
            {displayPhotos.map((photo, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={photo.id || idx}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    isActive
                      ? 'opacity-100 scale-100 z-10'
                      : 'opacity-0 scale-105 pointer-events-none z-0'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover select-none will-change-[opacity,transform]"
                    loading="eager"
                  />
                  {/* Subtle romantic vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                </div>
              );
            })}

            {/* Corner gold seal accent */}
            <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-[#8B1E3F] text-[#E6C687] flex items-center justify-center shadow-md border border-[#E6C687]/50">
              <Heart className="w-4 h-4 fill-[#E6C687]" />
            </div>

            {/* Subtle tap prompt overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 py-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-center text-[10px] text-white/90 font-sans tracking-wide">
              Tap right side to next · Tap left to back
            </div>
          </div>

          {/* Photo Captions with Smooth Cross-Fade Dissolve */}
          <div className="relative pt-3.5 pb-1 px-2 text-center min-h-[68px] flex flex-col items-center justify-center">
            {displayPhotos.map((photo, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={photo.id || idx}
                  className={`absolute inset-x-0 transition-all duration-700 ease-in-out ${
                    isActive
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}
                >
                  <p className="font-serif text-sm sm:text-base font-semibold text-[#4A1525] leading-snug">
                    "{photo.caption}"
                  </p>
                  <p className="text-[11px] font-mono tracking-widest uppercase text-[#8B1E3F]/80 mt-1">
                    {recipientName} · Cherished Moment
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-30 max-w-md w-full mx-auto flex items-center justify-between gap-3 pt-2 pointer-events-auto">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrevPhoto}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Previous photo (or tap left side)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Play / Pause Toggle */}
        <button
          type="button"
          onClick={() => {
            romanticAmbientSynth.start();
            setIsPaused(!isPaused);
          }}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
        >
          {isPaused ? <Play className="w-4 h-4 text-[#E6C687]" /> : <Pause className="w-4 h-4 text-white" />}
          <span>{isPaused ? 'Resume' : 'Pause (4s)'}</span>
        </button>

        {/* Next / Proceed Button */}
        {currentIndex < displayPhotos.length - 1 ? (
          <button
            type="button"
            onClick={handleNextPhoto}
            className="p-3 rounded-full bg-[#8B1E3F] hover:bg-[#A6244A] text-white border border-[#FF94AB]/40 transition-all cursor-pointer shadow-lg"
            title="Next photo (or tap right side)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              romanticAmbientSynth.start();
              onComplete();
            }}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#8B1E3F] to-[#D4AF37] text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Epistle</span>
            <Mail className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
