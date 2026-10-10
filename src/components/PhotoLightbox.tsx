import React, { useEffect } from 'react';
import { GalleryPhoto } from '../types';
import { X, ChevronLeft, ChevronRight, Calendar, MapPin, Heart } from 'lucide-react';

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo Lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A0B10]/90 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      {hasPrev && (
        <button
          type="button"
          onClick={() => onNavigate(photos[currentIndex - 1])}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          type="button"
          onClick={() => onNavigate(photos[currentIndex + 1])}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Next photo"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Modal Polaroid Container */}
      <div
        className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Display Area */}
        <div className="relative flex-1 min-h-[280px] sm:min-h-[420px] max-h-[65vh] bg-[#FAF5F4] rounded-xl overflow-hidden flex items-center justify-center border border-[#EADBDA]">
          {Boolean(photo.url && photo.url.trim()) ? (
            <img
              src={photo.url}
              alt={photo.caption}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-8 max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#8B1E3F]">
                <Heart className="w-8 h-8 fill-[#F8D2D8]" />
              </div>
              <p className="font-serif text-lg font-bold text-[#4A1525] mb-1">
                Cherished Moment with Precious
              </p>
              <p className="text-xs text-[#8C6B73]">
                {photo.caption}
              </p>
            </div>
          )}
        </div>

        {/* Caption & Metadata Footer */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#F2E5E4] mt-4">
          <div>
            <p className="font-serif text-lg font-semibold text-[#4A1525] leading-snug">
              {photo.caption}
            </p>
            <div className="flex items-center gap-3 text-xs text-[#8C6B73] mt-1">
              {photo.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C07D85]" />
                  <span>{photo.date}</span>
                </span>
              )}
              {photo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C07D85]" />
                  <span>{photo.location}</span>
                </span>
              )}
            </div>
          </div>

          <div className="text-xs font-mono text-[#9E5D6C] shrink-0 self-end sm:self-center">
            {currentIndex + 1} of {photos.length}
          </div>
        </div>
      </div>
    </div>
  );
};
