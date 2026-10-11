import React, { useEffect, useRef } from 'react';
import { GalleryPhoto } from '../types';
import { X, ChevronLeft, ChevronRight, Calendar, MapPin, Heart, Download } from 'lucide-react';

interface PhotoLightboxProps {
  photo: GalleryPhoto | null;
  photos: GalleryPhoto[];
  onClose: () => void;
  onNavigate: (photo: GalleryPhoto) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  photos,
  onClose,
  onNavigate,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!photo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        const currIdx = photos.findIndex((p) => p.id === photo.id);
        if (currIdx > 0) onNavigate(photos[currIdx - 1]);
      }
      if (e.key === 'ArrowRight') {
        const currIdx = photos.findIndex((p) => p.id === photo.id);
        if (currIdx < photos.length - 1) onNavigate(photos[currIdx + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, photos, onClose, onNavigate]);

  if (!photo) return null;

  const currentIndex = photos.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  // Touch swipe support in Lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0 && hasNext) {
        onNavigate(photos[currentIndex + 1]);
      } else if (diffX > 0 && hasPrev) {
        onNavigate(photos[currentIndex - 1]);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDownload = () => {
    if (!photo.url) return;
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `eyan_mi_keepsake_photo_${currentIndex + 1}.jpg`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full-Screen Photo Lightbox"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-[#12050A]/95 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      {/* Top action buttons: Close & Download */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2">
        {photo.url && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer backdrop-blur-md"
            title="Download this keepsake photo"
            aria-label="Download photo"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer backdrop-blur-md"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Desktop Previous & Next buttons (Hidden on tiny mobile to avoid photo clipping, swipe works everywhere) */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(photos[currentIndex - 1]);
          }}
          className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(photos[currentIndex + 1]);
          }}
          className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          aria-label="Next photo"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Modal Container */}
      <div
        className="relative max-w-3xl w-full max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Display Area */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[440px] max-h-[66vh] bg-[#FAF5F4] rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center border border-[#EADBDA]">
          {Boolean(photo.url && photo.url.trim()) ? (
            <img
              src={photo.url}
              alt={photo.caption}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-6 max-w-sm">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#8B1E3F]">
                <Heart className="w-7 h-7 fill-[#F8D2D8]" />
              </div>
              <p className="font-serif text-base font-bold text-[#4A1525] mb-1">
                Cherished Keepsake Moment
              </p>
              <p className="text-xs text-[#8C6B73]">
                {photo.caption}
              </p>
            </div>
          )}
        </div>

        {/* Caption & Metadata Footer - Responsive without text overflow */}
        <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#F2E5E4] mt-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-base sm:text-xl font-bold text-[#4A1525] leading-snug break-words">
              {photo.caption}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8C6B73] mt-0.5">
              {photo.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C07D85]" />
                  <span>{photo.date}</span>
                </span>
              )}
              {photo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C07D85]" />
                  <span>{photo.location}</span>
                </span>
              )}
              <span className="text-[#A87E88] text-[11px]">· Swipe to navigate</span>
            </div>
          </div>

          {/* Bottom row on mobile: Nav buttons + Counter */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
            <div className="flex sm:hidden items-center gap-1">
              <button
                type="button"
                onClick={() => hasPrev && onNavigate(photos[currentIndex - 1])}
                disabled={!hasPrev}
                className="p-1.5 rounded-lg bg-[#FAF5F4] disabled:opacity-30 text-[#8B1E3F] border border-[#EADBDA]"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => hasNext && onNavigate(photos[currentIndex + 1])}
                disabled={!hasNext}
                className="p-1.5 rounded-lg bg-[#FAF5F4] disabled:opacity-30 text-[#8B1E3F] border border-[#EADBDA]"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-[#9E5D6C] shrink-0 bg-[#FAF5F4] px-2.5 py-1 rounded-full border border-[#EADBDA]">
              {currentIndex + 1} of {photos.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
