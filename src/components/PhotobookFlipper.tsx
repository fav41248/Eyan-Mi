import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GalleryPhoto } from '../types';
import { ChevronLeft, ChevronRight, Maximize2, BookOpen, Heart } from 'lucide-react';

interface PhotobookFlipperProps {
  photos: GalleryPhoto[];
  recipientName?: string;
  onPhotoClick?: (photo: GalleryPhoto, index: number) => void;
  autoPlayIntervalMs?: number;
  isAutoPlaying?: boolean;
  onAutoPlayToggle?: () => void;
  className?: string;
}

export const PhotobookFlipper: React.FC<PhotobookFlipperProps> = ({
  photos,
  recipientName = 'Precious',
  onPhotoClick,
  autoPlayIntervalMs = 4500,
  isAutoPlaying = false,
  className = '',
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Touch gesture support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const totalPages = photos.length;
  const currentPhoto = photos[currentPage] || photos[0];

  const handleNextPage = useCallback(() => {
    if (isFlipping || totalPages <= 1) return;
    setIsFlipping(true);
    setFlipDirection('forward');

    setTimeout(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
      setFlipDirection(null);
      setIsFlipping(false);
    }, 550);
  }, [isFlipping, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (isFlipping || totalPages <= 1) return;
    setIsFlipping(true);
    setFlipDirection('backward');

    setTimeout(() => {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
      setFlipDirection(null);
      setIsFlipping(false);
    }, 550);
  }, [isFlipping, totalPages]);

  // Autoplay support if enabled
  useEffect(() => {
    if (!isAutoPlaying || isFlipping || totalPages <= 1) return;
    const interval = setInterval(() => {
      handleNextPage();
    }, autoPlayIntervalMs);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isFlipping, totalPages, autoPlayIntervalMs, handleNextPage]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Ensure horizontal gesture is intentional
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0) {
        handleNextPage(); // Swiped left -> next page
      } else {
        handlePrevPage(); // Swiped right -> prev page
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'ArrowLeft') handlePrevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage]);

  if (!photos || photos.length === 0) return null;

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Photobook Outer Case / Leather & Gold Gilded Binder */}
      <div className="relative p-2.5 sm:p-5 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2D0D17] via-[#1E0911] to-[#3B121E] shadow-[0_20px_50px_-15px_rgba(40,10,20,0.6)] border-2 border-[#D4AF37]/40">
        {/* Decorative corner metallic braces */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-4 sm:w-5 h-4 sm:h-5 border-t-2 border-l-2 border-[#E6C687] rounded-tl-md sm:rounded-tl-lg pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 sm:w-5 h-4 sm:h-5 border-t-2 border-r-2 border-[#E6C687] rounded-tr-md sm:rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-4 sm:w-5 h-4 sm:h-5 border-b-2 border-l-2 border-[#E6C687] rounded-bl-md sm:rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-4 sm:w-5 h-4 sm:h-5 border-b-2 border-r-2 border-[#E6C687] rounded-br-md sm:rounded-br-lg pointer-events-none" />

        {/* Top Header Label on Book */}
        <div className="flex items-center justify-between px-1 sm:px-4 mb-2.5 sm:mb-4 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#E6C687] font-serif tracking-wider truncate mr-2">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] shrink-0" />
            <span className="font-semibold text-[11px] sm:text-sm truncate">
              {recipientName}'s Keepsake Photobook
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-[10px] sm:text-[11px] font-mono text-[#E8C5CE]/90">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="hidden sm:flex items-center gap-1">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!isFlipping) {
                      setCurrentPage(idx);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentPage
                      ? 'w-5 bg-[#E6C687]'
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Jump to page ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* The 3D Book Spread */}
        <div className="perspective-1000 relative">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF6F0] shadow-2xl border border-[#EADBDA]">
            
            {/* DESKTOP DOUBLE-SPREAD (md: and up) */}
            <div className="hidden md:grid md:grid-cols-2 min-h-[420px]">
              {/* Center Book Spine Shadow Crease */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/15 via-black/5 to-black/15 z-30 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#8B1E3F]/30 z-30 pointer-events-none" />

              {/* LEFT PAGE: Handwritten note, Memory Number, Date & Sentiment */}
              <div className="p-6 md:p-8 flex flex-col justify-between bg-[#FDFBF7] relative border-r border-[#EFE5DB] text-[#241318]">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#8B1E3F_0.75px,transparent_0.75px)] [background-size:16px_16px]" />

                <div className="relative z-10 space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0F2] border border-[#F4CED4] text-[11px] font-semibold text-[#8B1E3F]">
                    <Heart className="w-3.5 h-3.5 fill-[#8B1E3F]" />
                    <span>Cherished Memory #{currentPage + 1}</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#4A1525] leading-tight break-words">
                    {currentPhoto.caption || `Unforgettable smile of ${recipientName}`}
                  </h3>

                  <p className="font-serif italic text-xs sm:text-sm text-[#6E4F57] leading-relaxed">
                    "Every photograph holds a heartbeat of laughter, an instant of pure joy that time can never erase."
                  </p>
                </div>

                {/* Bottom Metadata */}
                <div className="relative z-10 pt-4 border-t border-[#EADBDA]/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#4A1525]">
                      {currentPhoto.date || 'Timeless Keepsake'}
                    </p>
                    {currentPhoto.location && (
                      <p className="text-[11px] text-[#8C6B73]">
                        📍 {currentPhoto.location}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={isFlipping}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF0F2] hover:bg-[#F5DFE4] text-[#8B1E3F] text-xs font-medium transition-colors cursor-pointer"
                    title="Turn to previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                </div>
              </div>

              {/* RIGHT PAGE: The Photo itself with 3D Flip Layer */}
              <div
                className={`p-5 md:p-6 flex flex-col justify-center items-center bg-[#FAF6F0] relative overflow-hidden transition-all duration-500 ${
                  isFlipping && flipDirection === 'forward'
                    ? 'animate-page-flip-forward'
                    : isFlipping && flipDirection === 'backward'
                    ? 'animate-page-flip-backward'
                    : ''
                }`}
              >
                <div
                  onClick={() => onPhotoClick && onPhotoClick(currentPhoto, currentPage)}
                  className="group relative w-full aspect-[4/3] max-w-sm rounded-xl overflow-hidden bg-white p-2 shadow-lg border border-[#E0D0C8] cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01]"
                >
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#E6C687]/80 rounded-xs shadow-xs z-20 pointer-events-none" />

                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#FAF2F2]">
                    <img
                      src={currentPhoto.url}
                      alt={currentPhoto.caption || 'Birthday keepsake memory'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-[#4A1525]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#8B1E3F] text-xs font-semibold shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Full View</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm mt-3 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#8C6B73] italic">
                    Tap photo to enlarge · Swipe to flip
                  </span>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={isFlipping}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Flip to next page"
                  >
                    <span>Flip Page</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Dog-ear corner */}
                <div
                  onClick={handleNextPage}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-[#D4AF37] via-[#F3E5AB] to-transparent cursor-pointer shadow-md hover:scale-125 transition-transform"
                  title="Click corner to flip page"
                />
              </div>
            </div>

            {/* MOBILE SINGLE-PAGE VIEW (< md) - Structured, no overlay */}
            <div
              className={`md:hidden flex flex-col p-3 sm:p-4 bg-[#FDFBF7] text-[#241318] transition-all duration-500 ${
                isFlipping && flipDirection === 'forward'
                  ? 'animate-page-flip-forward'
                  : isFlipping && flipDirection === 'backward'
                  ? 'animate-page-flip-backward'
                  : ''
              }`}
            >
              {/* Top metadata */}
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF0F2] border border-[#F4CED4] text-[10px] font-semibold text-[#8B1E3F]">
                  <Heart className="w-3 h-3 fill-[#8B1E3F]" />
                  <span>Memory #{currentPage + 1}</span>
                </div>
                <span className="text-[10px] text-[#8C6B73]">
                  {currentPhoto.date || 'Keepsake Photo'}
                </span>
              </div>

              {/* Photo */}
              <div
                onClick={() => onPhotoClick && onPhotoClick(currentPhoto, currentPage)}
                className="group relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white p-1.5 shadow-md border border-[#E0D0C8] cursor-pointer my-1"
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-[#E6C687]/90 rounded-xs shadow-xs z-20 pointer-events-none" />

                <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#241318]">
                  <img
                    src={currentPhoto.url}
                    alt={currentPhoto.caption || 'Memory'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] font-medium flex items-center gap-1">
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>Enlarge</span>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="mt-2 text-center px-1">
                <h4 className="font-serif text-sm sm:text-base font-bold text-[#4A1525] leading-snug line-clamp-2 break-words">
                  "{currentPhoto.caption || `Cherished moment with ${recipientName}`}"
                </h4>
                <p className="text-[10px] text-[#8C6B73] italic mt-0.5">
                  Swipe left/right or tap buttons below to turn pages
                </p>
              </div>

              {/* Dog-ear corner */}
              <div
                onClick={handleNextPage}
                className="absolute bottom-0 right-0 w-7 h-7 bg-gradient-to-tl from-[#D4AF37] via-[#F3E5AB] to-transparent cursor-pointer shadow-sm"
                title="Turn page"
              />
            </div>

          </div>
        </div>

        {/* Navigation Controls: Clean on both Desktop and Mobile */}
        {/* On Desktop: Sleek floating side buttons; On Mobile: Bottom row buttons that never overlay text */}
        <div className="hidden md:block">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={isFlipping}
            aria-label="Previous page"
            className="absolute left-1 sm:-left-5 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-white/95 hover:bg-white text-[#8B1E3F] shadow-xl border border-[#EADBDA] transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={isFlipping}
            aria-label="Next page"
            className="absolute right-1 sm:-right-5 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-[#8B1E3F] hover:bg-[#A12449] text-white shadow-xl border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Footer (< md) */}
        <div className="md:hidden flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={isFlipping || currentPage === 0}
            className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-[11px] font-mono text-[#E8C5CE] px-2 shrink-0">
            {currentPage + 1} / {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={isFlipping}
            className="flex-1 py-2 px-3 rounded-xl bg-[#8B1E3F] hover:bg-[#9E2045] text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
          >
            <span>Next Page</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
