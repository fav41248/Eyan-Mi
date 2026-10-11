import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryPhoto } from '../types';
import {
  Heart,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Mail,
  Volume2,
  VolumeX,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { romanticAmbientSynth } from '../utils/audioEngine';
import { PhotoLightbox } from './PhotoLightbox';

interface PhotoLoaderProps {
  photos: GalleryPhoto[];
  openingTitle: string;
  openingSubtitle: string;
  recipientName: string;
  onComplete: () => void;
}

const PHOTO_DURATION_MS = 4500; // 4.5 seconds per photo page

export const PhotoLoader: React.FC<PhotoLoaderProps> = ({
  photos,
  openingTitle,
  openingSubtitle,
  recipientName,
  onComplete,
}) => {
  // Phase 1: 'headline' (shows the lovely romantic headline first - silent)
  // Phase 2: 'photos' (animated like a photobook that is flipping)
  const [phase, setPhase] = useState<'headline' | 'photos'>('headline');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [isMuted, setIsMuted] = useState(() => romanticAmbientSynth.isMuted());
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // 3D Page flip animation state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward' | null>(null);

  // Touch gesture support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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
  const currentPhoto = displayPhotos[currentIndex] || displayPhotos[0];

  // Romantic sound starts playing once the photobook starts showing (Phase 2)
  useEffect(() => {
    if (phase === 'photos') {
      romanticAmbientSynth.start();

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

  // Phase 1 timer: transition from headline to photobook
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

  // Navigate to Next Photo with 3D Page Flip Animation
  const handleNextPhoto = useCallback(() => {
    romanticAmbientSynth.start();
    if (isFlipping) return;

    if (currentIndex < displayPhotos.length - 1) {
      setIsFlipping(true);
      setFlipDirection('forward');

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setTimerKey((k) => k + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 550);
    } else {
      onComplete();
    }
  }, [currentIndex, displayPhotos.length, isFlipping, onComplete]);

  // Navigate to Previous Photo with 3D Page Flip Animation
  const handlePrevPhoto = useCallback(() => {
    romanticAmbientSynth.start();
    if (isFlipping) return;

    if (currentIndex > 0) {
      setIsFlipping(true);
      setFlipDirection('backward');

      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
        setTimerKey((k) => k + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 550);
    }
  }, [currentIndex, isFlipping]);

  // Phase 2 timer: Automatically flips pages every 4.5 seconds
  useEffect(() => {
    if (phase !== 'photos' || isPaused || !hasPhotos || selectedLightboxPhoto !== null) return;

    const interval = setTimeout(() => {
      handleNextPhoto();
    }, PHOTO_DURATION_MS);

    return () => clearTimeout(interval);
  }, [phase, currentIndex, isPaused, hasPhotos, timerKey, selectedLightboxPhoto, handleNextPhoto]);

  // Touch Swipe Gesture Detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0) {
        handleNextPhoto(); // Swiped left -> next page
      } else {
        handlePrevPhoto(); // Swiped right -> prev page
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'photos' || selectedLightboxPhoto !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selectedLightboxPhoto, handleNextPhoto, handlePrevPhoto]);

  // ================= PHASE 1: LOVELY HEADLINE FIRST (SILENT) =================
  if (phase === 'headline') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F0A12] text-white overflow-y-auto px-4 py-8">
        {/* Soft background ambient glow */}
        <div className="absolute inset-0 bg-radial from-[#8B1E3F]/40 via-transparent to-black pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-xl w-full text-center space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-1000 my-auto">
          {/* Subtle Glowing Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFD7DF] text-[11px] sm:text-xs font-medium tracking-widest uppercase shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687] animate-pulse" />
            <span>A Special Birthday Dedication</span>
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687] animate-pulse" />
          </div>

          {/* Opening Headline - responsive, break-words, no text overlay */}
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#FFF5F6] leading-[1.18] drop-shadow-md break-words px-2">
            {openingTitle || `For My Beloved ${recipientName} ❤️`}
          </h1>

          {/* Subtitle */}
          <p className="font-serif text-xs sm:text-base md:text-lg text-[#E8C5CE] leading-relaxed max-w-md mx-auto italic font-light px-3">
            {openingSubtitle ||
              'Before you unseal your handwritten birthday letter, take a moment to flip through these captured memories of you...'}
          </p>

          {/* Action buttons */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
            {hasPhotos ? (
              <button
                type="button"
                onClick={() => {
                  setPhase('photos');
                  romanticAmbientSynth.start();
                }}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-full bg-gradient-to-r from-[#8B1E3F] to-[#B32752] text-white text-xs font-semibold tracking-wider uppercase shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#FF94AB]/30"
              >
                <BookOpen className="w-4 h-4 text-[#E6C687]" />
                <span>Open Keepsake Photobook ({displayPhotos.length})</span>
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
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span className="w-2 h-2 rounded-full bg-[#E6C687] animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-[#E6C687] animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-[#E6C687] animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  // ================= PHASE 2: ANIMATED 3D FLIPPING PHOTOBOOK EXPERIENCE =================
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#14040B] text-white overflow-hidden p-2.5 sm:p-5 md:p-8 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-[#8B1E3F]/35 via-black/85 to-black pointer-events-none" />

      {/* Tap Zones for easy mobile page flipping */}
      <div
        className="hidden sm:block absolute inset-y-16 left-0 w-1/6 z-20 cursor-pointer"
        onClick={handlePrevPhoto}
        title="Tap left to flip to previous page"
      />
      <div
        className="hidden sm:block absolute inset-y-16 right-0 w-1/6 z-20 cursor-pointer"
        onClick={handleNextPhoto}
        title="Tap right to flip to next page"
      />

      {/* Top Header & Progress Bar */}
      <div className="relative z-30 max-w-4xl w-full mx-auto space-y-2 pointer-events-auto">
        {/* Progress indicator segments */}
        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
          {displayPhotos.map((_, idx) => (
            <div
              key={idx}
              className="h-1 sm:h-1.5 flex-1 rounded-full overflow-hidden bg-white/20 transition-all cursor-pointer"
              onClick={() => {
                if (!isFlipping) setCurrentIndex(idx);
              }}
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

        {/* Top bar controls: Mute button + Page info + Skip to epistle */}
        <div className="flex items-center justify-between text-xs text-[#E8C5CE] gap-2">
          {/* Mute and page info */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title={isMuted ? 'Unmute romantic soundtrack' : 'Mute romantic soundtrack'}
              aria-label={isMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#FFB3C1]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#E6C687] animate-pulse" />
              )}
            </button>

            <span className="font-serif tracking-wide flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs">
              <BookOpen className="w-3 h-3 text-[#E6C687] shrink-0" />
              <span className="font-medium whitespace-nowrap">
                Page {currentIndex + 1} of {displayPhotos.length}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              romanticAmbientSynth.start();
              onComplete();
            }}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer backdrop-blur-md shrink-0"
          >
            <Mail className="w-3 h-3 text-[#FFB3C1]" />
            <span className="hidden sm:inline">Open Birthday Epistle 💌</span>
            <span className="sm:hidden">Epistle 💌</span>
          </button>
        </div>
      </div>

      {/* Main Center Stage: 3D ANIMATED FLIPPING PHOTOBOOK */}
      <div className="relative z-30 flex-1 flex items-center justify-center py-1 sm:py-3 pointer-events-auto min-h-0">
        <div className="relative w-full max-w-3xl mx-auto h-full flex items-center justify-center">
          {/* 3D Photobook Outer Leather Hardcover with Gold Filigree */}
          <div className="relative w-full p-2 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2D0D17] via-[#1E0911] to-[#38101C] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] border-2 border-[#D4AF37]/45">
            {/* Metallic Gold Corner Protectors */}
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-3 sm:w-6 h-3 sm:h-6 border-t-2 border-l-2 border-[#E6C687] rounded-tl-md pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 sm:w-6 h-3 sm:h-6 border-t-2 border-r-2 border-[#E6C687] rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-3 sm:w-6 h-3 sm:h-6 border-b-2 border-l-2 border-[#E6C687] rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-3 sm:w-6 h-3 sm:h-6 border-b-2 border-r-2 border-[#E6C687] rounded-br-md pointer-events-none" />

            {/* Book Spine Center Highlight (Visible on desktop) */}
            <div className="hidden md:block absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/20 via-black/5 to-black/20 z-40 pointer-events-none" />
            <div className="hidden md:block absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-0.5 bg-[#8B1E3F]/40 z-40 pointer-events-none" />

            {/* The Book Spread - Responsive Layout */}
            {/* Desktop (md:): Double Spread; Mobile (< md): Single Focused Luxury Card */}
            <div className="perspective-1000 relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF6F0] shadow-2xl border border-[#EADBDA]">
              
              {/* DESKTOP DOUBLE-SPREAD (md: and up) */}
              <div className="hidden md:grid md:grid-cols-2 min-h-[380px]">
                {/* LEFT PAGE: Handwritten Dedication & Caption */}
                <div className="p-6 md:p-7 flex flex-col justify-between bg-[#FDFBF7] relative border-r border-[#EFE5DB] text-[#241318]">
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8B1E3F_0.75px,transparent_0.75px)] [background-size:16px_16px]" />

                  <div className="relative z-10 space-y-3.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0F2] border border-[#F4CED4] text-[11px] font-semibold text-[#8B1E3F]">
                      <Heart className="w-3.5 h-3.5 fill-[#8B1E3F]" />
                      <span>Memory #{currentIndex + 1} of {displayPhotos.length}</span>
                    </div>

                    <h3 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold text-[#4A1525] leading-snug break-words">
                      "{currentPhoto.caption}"
                    </h3>

                    <p className="font-serif italic text-xs text-[#6E4F57] leading-relaxed">
                      "Every photograph is a doorway back into an unforgettable laugh, a cherished smile, and a memory made forever."
                    </p>
                  </div>

                  <div className="relative z-10 pt-3 border-t border-[#EADBDA]/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-serif font-semibold text-[#4A1525] truncate">
                        Dedicated to {recipientName}
                      </p>
                      <p className="text-[11px] text-[#8C6B73]">
                        {currentPhoto.date || 'Cherished Birthday Keepsake'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      disabled={isFlipping || currentIndex === 0}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF0F2] hover:bg-[#F5DFE4] disabled:opacity-40 text-[#8B1E3F] text-xs font-medium transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT PAGE: Photo with 3D Flip */}
                <div
                  className={`p-5 flex flex-col justify-center items-center bg-[#FAF6F0] relative overflow-hidden transition-all duration-500 ${
                    isFlipping && flipDirection === 'forward'
                      ? 'animate-page-flip-forward'
                      : isFlipping && flipDirection === 'backward'
                      ? 'animate-page-flip-backward'
                      : ''
                  }`}
                >
                  <div className="w-20 h-4 bg-[#E6C687]/80 rounded-xs shadow-xs mb-2 z-20 pointer-events-none" />

                  <div
                    onClick={() => setSelectedLightboxPhoto(currentPhoto)}
                    className="group relative w-full aspect-[4/3] max-w-sm rounded-xl overflow-hidden bg-white p-2 shadow-md border border-[#E0D0C8] cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01]"
                    title="Click to view photo in full-screen Lightbox"
                  >
                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#241318]">
                      <img
                        src={currentPhoto.url}
                        alt={currentPhoto.caption}
                        className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                        loading="eager"
                      />
                      <div className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-[#8B1E3F] text-[#E6C687] flex items-center justify-center shadow-md border border-[#E6C687]/50">
                        <Heart className="w-3.5 h-3.5 fill-[#E6C687]" />
                      </div>
                      <div className="absolute inset-0 bg-[#4A1525]/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#8B1E3F] text-xs font-bold shadow-lg">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Enlarge Lightbox</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-sm mt-3 flex items-center justify-between text-xs text-[#6E4F57]">
                    <span className="text-[11px] italic">
                      Tap photo to enlarge · Swipe to flip
                    </span>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      disabled={isFlipping}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <span>Flip Page</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dog-Ear Corner */}
                  <div
                    onClick={handleNextPhoto}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-[#D4AF37] via-[#F3E5AB] to-transparent cursor-pointer shadow-md hover:scale-125 transition-transform"
                    title="Click corner to turn page"
                  />
                </div>
              </div>

              {/* MOBILE SINGLE-PAGE SPREAD (< md) */}
              <div
                className={`md:hidden flex flex-col justify-between p-3 sm:p-4 bg-[#FDFBF7] text-[#241318] transition-all duration-500 ${
                  isFlipping && flipDirection === 'forward'
                    ? 'animate-page-flip-forward'
                    : isFlipping && flipDirection === 'backward'
                    ? 'animate-page-flip-backward'
                    : ''
                }`}
              >
                {/* Top Badge & Memory Index */}
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0F2] border border-[#F4CED4] text-[10px] font-semibold text-[#8B1E3F]">
                    <Heart className="w-3 h-3 fill-[#8B1E3F]" />
                    <span>Memory #{currentIndex + 1} of {displayPhotos.length}</span>
                  </div>
                  <span className="text-[10px] text-[#8C6B73] font-medium">
                    {currentPhoto.date || 'Keepsake Photo'}
                  </span>
                </div>

                {/* Main Photo Card */}
                <div
                  onClick={() => setSelectedLightboxPhoto(currentPhoto)}
                  className="group relative w-full aspect-[4/3] max-h-[46vh] rounded-xl overflow-hidden bg-white p-1.5 shadow-md border border-[#E0D0C8] cursor-pointer mx-auto my-1"
                >
                  {/* Washi tape */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-[#E6C687]/90 rounded-xs shadow-xs z-20 pointer-events-none" />

                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#241318]">
                    <img
                      src={currentPhoto.url}
                      alt={currentPhoto.caption}
                      className="w-full h-full object-cover select-none"
                      loading="eager"
                    />

                    {/* Wax Seal Badge */}
                    <div className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-[#8B1E3F] text-[#E6C687] flex items-center justify-center shadow-md border border-[#E6C687]/50">
                      <Heart className="w-3 h-3 fill-[#E6C687]" />
                    </div>

                    {/* Tap hint */}
                    <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] font-medium flex items-center gap-1">
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>Enlarge</span>
                    </div>
                  </div>
                </div>

                {/* Caption - structured, clean typography, no overflow */}
                <div className="mt-2 text-center px-1">
                  <p className="font-serif text-sm sm:text-base font-bold text-[#4A1525] leading-snug line-clamp-2 break-words">
                    "{currentPhoto.caption}"
                  </p>
                  <p className="text-[10px] text-[#8C6B73] italic mt-0.5">
                    Dedicated to {recipientName} · Swipe or tap to flip
                  </p>
                </div>

                {/* Interactive Dog-Ear Corner */}
                <div
                  onClick={handleNextPhoto}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-gradient-to-tl from-[#D4AF37] via-[#F3E5AB] to-transparent cursor-pointer shadow-sm"
                  title="Turn page"
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-30 max-w-md w-full mx-auto flex items-center justify-between gap-2 sm:gap-3 pt-1 sm:pt-2 pointer-events-auto">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrevPhoto}
          disabled={currentIndex === 0 || isFlipping}
          className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
          title="Previous page (or swipe right)"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Play / Pause Toggle */}
        <button
          type="button"
          onClick={() => {
            romanticAmbientSynth.start();
            setIsPaused(!isPaused);
          }}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-[#E6C687]" /> : <Pause className="w-3.5 h-3.5 text-white" />}
          <span>{isPaused ? 'Resume Flip' : 'Auto (4.5s)'}</span>
        </button>

        {/* Next / Proceed Button */}
        {currentIndex < displayPhotos.length - 1 ? (
          <button
            type="button"
            onClick={handleNextPhoto}
            disabled={isFlipping}
            className="p-2 sm:p-2.5 rounded-full bg-[#8B1E3F] hover:bg-[#A6244A] text-white border border-[#FF94AB]/40 transition-all cursor-pointer shadow-md shrink-0"
            title="Next page (or swipe left)"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              romanticAmbientSynth.start();
              onComplete();
            }}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#8B1E3F] to-[#D4AF37] text-white text-[11px] sm:text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Epistle</span>
            <Mail className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Full-Screen Lightbox Modal for any photo in the photobook */}
      <PhotoLightbox
        photo={selectedLightboxPhoto}
        photos={displayPhotos}
        onClose={() => setSelectedLightboxPhoto(null)}
        onNavigate={(p) => setSelectedLightboxPhoto(p)}
      />
    </div>
  );
};
