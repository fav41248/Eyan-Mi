import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GalleryPhoto } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  BookOpen,
  LayoutGrid,
  Sparkles,
  Calendar,
  MapPin,
  Heart,
  Sliders,
} from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';
import { PhotobookFlipper } from './PhotobookFlipper';

interface PhotoCarouselProps {
  photos: GalleryPhoto[];
  recipientName?: string;
  onUpdatePhoto?: (id: string, file: File) => void;
  initialMode?: 'carousel' | 'photobook' | 'grid';
  className?: string;
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  photos,
  recipientName = 'Precious',
  onUpdatePhoto,
  initialMode = 'carousel',
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'photobook' | 'grid'>(initialMode);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const totalPhotos = photos.length;
  const currentPhoto = photos[currentIndex] || photos[0];

  const handleNext = useCallback(() => {
    if (totalPhotos <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalPhotos);
  }, [totalPhotos]);

  const handlePrev = useCallback(() => {
    if (totalPhotos <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  }, [totalPhotos]);

  // Keyboard navigation
  useEffect(() => {
    if (viewMode !== 'carousel') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhoto) return; // Lightbox handles its own keys
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedPhoto, handleNext, handlePrev]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -40) {
      handleNext();
    } else if (dragOffset > 40) {
      handlePrev();
    }
    setDragOffset(0);
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragStartX(e.clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -45) {
      handleNext();
    } else if (dragOffset > 45) {
      handlePrev();
    }
    setDragOffset(0);
  };

  if (!photos || photos.length === 0) return null;

  return (
    <section className={`py-4 sm:py-8 max-w-5xl mx-auto ${className}`}>
      {/* Mode Switcher Bar - Responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 text-left">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#9E5D6C] font-semibold">
            <span>Keepsake Memories</span>
            <span aria-hidden="true">·</span>
            <span>{photos.length} Photographs</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A1525] mt-0.5">
            Cherished Scrapbook Album
          </h3>
        </div>

        {/* View Mode Toggle Controls - Fits seamlessly on mobile */}
        <div className="flex items-center p-1 bg-[#F5EBE9] rounded-xl border border-[#EADBDA] shadow-xs self-start sm:self-auto max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setViewMode('photobook')}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'photobook'
                ? 'bg-white text-[#8B1E3F] shadow-xs font-semibold'
                : 'text-[#6E4F57] hover:text-[#4A1525]'
            }`}
            title="Photobook 3D Flipping Mode"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flipping Photobook</span>
            <span className="sm:hidden">Photobook</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('carousel')}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'carousel'
                ? 'bg-white text-[#8B1E3F] shadow-xs font-semibold'
                : 'text-[#6E4F57] hover:text-[#4A1525]'
            }`}
            title="Interactive Swipe Carousel"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Swipe Carousel</span>
            <span className="sm:hidden">Carousel</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'grid'
                ? 'bg-white text-[#8B1E3F] shadow-xs font-semibold'
                : 'text-[#6E4F57] hover:text-[#4A1525]'
            }`}
            title="Scrapbook Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid View</span>
            <span className="sm:hidden">Grid</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: PHOTOBOOK FLIPPER */}
      {viewMode === 'photobook' && (
        <div className="animate-fade-in">
          <PhotobookFlipper
            photos={photos}
            recipientName={recipientName}
            onPhotoClick={(photo) => setSelectedPhoto(photo)}
          />
        </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE SWIPE CAROUSEL */}
      {viewMode === 'carousel' && (
        <div
          ref={containerRef}
          className="relative animate-fade-in select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Main Stage: Featured Active Photo Card */}
          <div className="relative max-w-2xl mx-auto px-1 sm:px-4">
            {/* Background layered card effect for 3D depth */}
            <div className="hidden sm:block absolute inset-0 bg-[#E8D8D5] rounded-3xl transform rotate-2 translate-y-2 opacity-60 pointer-events-none" />
            <div className="hidden sm:block absolute inset-0 bg-[#F2E5E2] rounded-3xl transform -rotate-2 -translate-y-1 opacity-70 pointer-events-none" />

            {/* Top Washi Tape Sticker */}
            <div className="relative z-20 flex justify-center -mb-3 sm:-mb-4">
              <div
                className={`w-20 sm:w-28 h-5 sm:h-6 rounded-xs shadow-xs transform -rotate-1 ${
                  currentPhoto.tapeColor === 'gold'
                    ? 'bg-[#E6C687]/90 border border-[#D4AF37]/40'
                    : 'bg-[#F2CED4]/90 border border-[#E0B8C0]/40'
                }`}
              />
            </div>

            {/* Active Card Body */}
            <div
              className={`relative z-10 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-lg sm:shadow-xl border border-[#EADBDA] transition-transform duration-300 ${
                isDragging ? 'scale-[0.99] cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                transform: isDragging ? `translateX(${dragOffset * 0.4}px)` : undefined,
              }}
            >
              {/* Photo Area */}
              <div
                onClick={() => setSelectedPhoto(currentPhoto)}
                className="group relative aspect-[4/3] sm:aspect-[16/10] bg-[#FAF5F4] rounded-xl sm:rounded-2xl overflow-hidden border border-[#F0DFDE] cursor-pointer"
              >
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || 'Birthday moment'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  draggable={false}
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-[#4A1525]/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-[#8B1E3F] text-xs font-bold shadow-xl">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Open in Full Lightbox</span>
                  </div>
                </div>

                {/* Floating Fullscreen button on top right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(currentPhoto);
                  }}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/45 hover:bg-black/60 text-white backdrop-blur-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Full-screen Lightbox"
                  aria-label="Full-screen photo view"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Caption & Metadata Footer - clean typography, no text overlap */}
              <div className="mt-3.5 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#F2E5E4]">
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-base sm:text-xl font-bold text-[#4A1525] leading-snug break-words">
                    {currentPhoto.caption || `Keepsake photograph of ${recipientName}`}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8C6B73] mt-1">
                    {currentPhoto.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C07D85]" />
                        <span>{currentPhoto.date}</span>
                      </span>
                    )}
                    {currentPhoto.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C07D85]" />
                        <span>{currentPhoto.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo Counter */}
                <div className="text-xs font-mono text-[#9E5D6C] shrink-0 self-end sm:self-center bg-[#FAF5F4] px-2.5 py-0.5 rounded-full border border-[#EADBDA]">
                  {currentIndex + 1} / {totalPhotos}
                </div>
              </div>
            </div>
          </div>

          {/* Left & Right Navigation Buttons - Responsive sizing */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-white/95 hover:bg-white text-[#8B1E3F] shadow-lg border border-[#EADBDA] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-[#8B1E3F] hover:bg-[#721532] text-white shadow-lg border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Thumbnail Filmstrip & Swipe Prompt */}
          <div className="mt-6 sm:mt-8 space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-center text-xs text-[#8C6B73] px-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Swipe left or right to browse · Tap any photo for Lightbox</span>
            </div>

            {/* Thumbnail Navigation Row - smooth scrolling without cropped edges */}
            <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto py-2 px-2 max-w-full scrollbar-none">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'border-[#8B1E3F] scale-105 shadow-md ring-2 ring-[#8B1E3F]/30'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  aria-label={`Jump to photo ${idx + 1}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: CLASSIC SCRAPBOOK GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 animate-fade-in px-1">
          {photos.map((photo, index) => {
            const rotationClass =
              index % 4 === 0
                ? 'sm:-rotate-1'
                : index % 4 === 1
                ? 'sm:rotate-1.5'
                : index % 4 === 2
                ? 'sm:-rotate-0.5'
                : 'sm:rotate-1';

            return (
              <div
                key={photo.id || index}
                className={`relative group transition-all duration-300 transform hover:scale-[1.01] hover:rotate-0 hover:z-20 ${rotationClass}`}
              >
                {/* Washi tape header */}
                <div
                  className={`washi-tape-top ${
                    photo.tapeColor === 'gold'
                      ? 'washi-tape-gold'
                      : photo.tapeColor === 'rose'
                      ? 'bg-[#E8C4C4]/85'
                      : 'bg-[#FCE6E9]/85'
                  }`}
                />

                {/* Polaroid Frame Card */}
                <div
                  onClick={() => setSelectedPhoto(photo)}
                  className="scrapbook-polaroid p-3.5 sm:p-4 pb-5 sm:pb-6 rounded-2xl border border-[#EADBDA] bg-white cursor-pointer relative shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-[#FAF5F4] rounded-xl overflow-hidden border border-[#F0DFDE] flex items-center justify-center">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[#4A1525]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-full bg-white/90 text-[#8B1E3F] shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                        <Heart className="w-4 h-4 fill-current" />
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 px-1 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif text-sm sm:text-base font-semibold text-[#4A1525] leading-snug break-words">
                        {photo.caption}
                      </h4>
                      <p className="text-[11px] text-[#8C6B73] mt-0.5">
                        {photo.date || 'Cherished Memory'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[#A87E88] shrink-0 bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#EADBDA]">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-Screen Lightbox Modal for any selected photo */}
      <PhotoLightbox
        photo={selectedPhoto}
        photos={photos}
        onClose={() => setSelectedPhoto(null)}
        onNavigate={(p) => setSelectedPhoto(p)}
      />
    </section>
  );
};
