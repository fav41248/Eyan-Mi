import React, { useState } from 'react';
import { GalleryPhoto } from '../types';
import { Camera, Heart, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  onAddPhoto?: (photo: GalleryPhoto) => void;
  onUpdatePhoto?: (id: string, file: File) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onAddPhoto,
  onUpdatePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const handleCardUpload = (e: React.ChangeEvent<HTMLInputElement>, photoId: string) => {
    const file = e.target.files?.[0];
    if (file && onUpdatePhoto) {
      onUpdatePhoto(photoId, file);
    }
  };

  return (
    <section id="gallery-section" className="py-12 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF0F2] border border-[#F4CED4] shadow-sm mb-4">
          <Camera className="w-5 h-5 text-[#8B1E3F]" />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#9E5D6C] font-medium mb-1">
          <span>Captured Radiance</span>
          <span aria-hidden="true">·</span>
          <span>A Scrapbook of Precious</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#4A1525] tracking-tight mb-4">
          Moments Frozen In Time
        </h2>

        <p className="text-sm sm:text-base text-[#6E4F57] max-w-md mx-auto font-light leading-relaxed">
          Snapshots of joy, laughter, and the unforgettable grace that you bring to every room.
        </p>
      </div>

      {/* Scrapbook Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 sm:gap-10">
        {photos.map((photo, index) => {
          const rotationClass =
            index % 4 === 0
              ? '-rotate-1.5'
              : index % 4 === 1
              ? 'rotate-2'
              : index % 4 === 2
              ? '-rotate-1'
              : 'rotate-1.5';

          return (
            <div
              key={photo.id}
              className={`relative group transition-all duration-300 transform hover:scale-[1.02] hover:rotate-0 hover:z-20 ${rotationClass}`}
            >
              {/* Scrapbook washi tape header */}
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
                className="scrapbook-polaroid p-4 pb-6 rounded-2xl border border-[#EADBDA] bg-white cursor-pointer relative"
              >
                {/* Image or Romantic Placeholder */}
                <div className="relative aspect-[4/3] bg-[#FAF5F4] rounded-xl overflow-hidden border border-[#F0DFDE] flex items-center justify-center">
                  {Boolean(photo.url && photo.url.trim()) ? (
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="p-6 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#8B1E3F] mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6 text-[#C07D85]" />
                      </div>
                      <p className="font-serif text-sm font-semibold text-[#4A1525]">
                        Memory Frame #{index + 1}
                      </p>
                      <p className="text-[11px] text-[#9E5D6C] mt-1 max-w-[200px]">
                        Tap to view or upload your photograph of Precious
                      </p>
                      
                      {/* Direct Upload Trigger */}
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] bg-white border border-[#E0B8C0] text-[#8B1E3F] hover:bg-[#FFF0F2] cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCardUpload(e, photo.id)}
                        />
                      </label>
                    </div>
                  )}

                  {/* Gentle hover overlay with heart badge */}
                  <div className="absolute inset-0 bg-[#4A1525]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-2.5 rounded-full bg-white/90 text-[#8B1E3F] shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                      <Heart className="w-5 h-5 fill-current" />
                    </span>
                  </div>
                </div>

                {/* Handwritten-style Caption */}
                <div className="mt-4 px-1 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-[#4A1525] leading-snug">
                      {photo.caption}
                    </h3>
                    <p className="text-xs text-[#8C6B73] mt-0.5">
                      {photo.date || 'Cherished Memory'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[#A87E88] shrink-0">
                    #{index + 1}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <PhotoLightbox
        photo={selectedPhoto}
        photos={photos}
        onClose={() => setSelectedPhoto(null)}
        onNavigate={(p) => setSelectedPhoto(p)}
      />
    </section>
  );
};
