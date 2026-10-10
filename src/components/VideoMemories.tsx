import React, { useRef, useState } from 'react';
import { VideoMemory } from '../types';
import { Film, Play, Pause, Volume2, VolumeX, Maximize2, Upload, Sparkles } from 'lucide-react';

interface VideoMemoriesProps {
  videos: VideoMemory[];
  onUploadVideo?: (id: string, file: File) => void;
}

export const VideoMemories: React.FC<VideoMemoriesProps> = ({
  videos,
  onUploadVideo,
}) => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const handleTogglePlay = (video: VideoMemory) => {
    const el = videoRefs.current[video.id];
    if (!el) return;

    if (el.paused) {
      el.play();
      setPlayingVideoId(video.id);
    } else {
      el.pause();
      setPlayingVideoId(null);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, videoId: string) => {
    const file = e.target.files?.[0];
    if (file && onUploadVideo) {
      onUploadVideo(videoId, file);
    }
  };

  return (
    <section id="video-section" className="py-12 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF0F2] border border-[#F4CED4] shadow-sm mb-4">
          <Film className="w-5 h-5 text-[#8B1E3F]" />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#9E5D6C] font-medium mb-1">
          <span>Memories In Motion</span>
          <span aria-hidden="true">·</span>
          <span>Cherished Recordings</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#4A1525] tracking-tight mb-4">
          Voices & Motion
        </h2>

        <p className="text-sm sm:text-base text-[#6E4F57] max-w-md mx-auto font-light leading-relaxed">
          Living reels capturing the genuine laughter, gestures, and magic of moments shared with Precious.
        </p>
      </div>

      {/* Video Memory Cards */}
      <div className="space-y-10">
        {videos.map((vid) => {
          const isPlaying = playingVideoId === vid.id;

          return (
            <div
              key={vid.id}
              className="relative rounded-3xl bg-white/95 p-4 sm:p-6 border border-[#EADBDA] shadow-xl shadow-[#4A1525]/8 overflow-hidden"
            >
              {/* Gold foil corner ornament */}
              <div className="washi-tape-top washi-tape-gold opacity-75" />

              {/* Video Player Frame */}
              <div className="relative aspect-video bg-[#241318] rounded-2xl overflow-hidden border border-[#522935] flex items-center justify-center group">
                {Boolean(vid.url && vid.url.trim()) ? (
                  <>
                    <video
                      ref={(el) => {
                        videoRefs.current[vid.id] = el;
                      }}
                      src={vid.url}
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-cover"
                      onEnded={() => setPlayingVideoId(null)}
                    />

                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(vid)}
                        className="pointer-events-auto w-16 h-16 rounded-full bg-white/90 text-[#8B1E3F] hover:bg-white hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-2xl cursor-pointer"
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      >
                        {isPlaying ? (
                          <Pause className="w-7 h-7 fill-current" />
                        ) : (
                          <Play className="w-7 h-7 fill-current ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Bottom toolbar */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs">
                      <span className="font-serif tracking-wide text-sm">{vid.title}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => videoRefs.current[vid.id]?.requestFullscreen?.()}
                          className="p-1.5 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Placeholder with Upload Option */
                  <div className="p-8 text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-[#FFD2DC] mx-auto mb-4 border border-white/20">
                      <Film className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white mb-2">
                      Personal Video Memory Slot
                    </h3>
                    <p className="text-xs text-[#E5B8C0] leading-relaxed mb-6 font-light">
                      Reserved for your personal video clip of Oluwapreciousimi. Tap below to upload a real video file, or supply the URL.
                    </p>

                    <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E3F] to-[#A62B50] text-white text-xs font-medium shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Upload Video Clip (.mp4, .mov, .webm)</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleVideoUpload(e, vid.id)}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Video Title & Caption */}
              <div className="mt-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#4A1525]">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-[#6E4F57] mt-0.5">
                    {vid.caption}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#9E5D6C] shrink-0">
                  {vid.duration || 'Motion Scrapbook'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
