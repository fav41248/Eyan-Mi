import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Heart, MailOpen, Play, Pause, Volume2, Mic, Printer, Download } from 'lucide-react';
import { EpistleParagraph, GalleryPhoto, LetterType, CelebrationConfig } from '../types';
import { PhotoCarousel } from './PhotoCarousel';
import { soundtrackEngine } from '../utils/audioEngine';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

interface BirthdayEnvelopeExperienceProps {
  onOpenLetter: () => void;
  isOpen: boolean;
  recipientName: string;
  paragraphs: EpistleParagraph[];
  epistleText?: string;
  letterType?: LetterType;
  voiceAudioUrl?: string;
  voiceDuration?: number;
  galleryPhotos?: GalleryPhoto[];
  finaleMessage?: string;
  celebrationConfig?: CelebrationConfig;
  onOpenExportModal?: () => void;
}

export const BirthdayEnvelopeExperience: React.FC<BirthdayEnvelopeExperienceProps> = ({
  onOpenLetter,
  isOpen,
  recipientName,
  paragraphs,
  epistleText,
  letterType = 'typed',
  voiceAudioUrl,
  voiceDuration = 0,
  galleryPhotos = [],
  finaleMessage = 'HAPPPYYYYYYY BIRTHDAYYYYYYYYY🤭🤗🎉',
  celebrationConfig,
  onOpenExportModal,
}) => {
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceCurrentTime, setVoiceCurrentTime] = useState(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState(voiceDuration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleEnvelopeClick = () => {
    if (isOpen) return;
    setIsUnsealing(true);
    setTimeout(() => {
      onOpenLetter();
    }, 600);
  };

  const celebrantDisplayName = recipientName?.trim() || 'My Person';

  // Compute clean paragraphs
  const cleanParagraphs: string[] =
    epistleText && epistleText.trim()
      ? epistleText.trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : paragraphs && paragraphs.length > 0
      ? paragraphs.map((p) => p.text.trim()).filter(Boolean)
      : [];

  // Voice playback toggler with ducking
  const toggleVoicePlayback = () => {
    if (!audioRef.current) return;
    if (isPlayingVoice) {
      audioRef.current.pause();
      setIsPlayingVoice(false);
      soundtrackEngine.duck(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingVoice(true);
        soundtrackEngine.duck(true);
      }).catch(() => {});
    }
  };

  const handleVoiceSeek = (percentage: number) => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration || audioTotalDuration;
    if (duration > 0) {
      const targetTime = (percentage / 100) * duration;
      audioRef.current.currentTime = targetTime;
      setVoiceCurrentTime(targetTime);
      setVoiceProgress(percentage);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioTotalDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setVoiceCurrentTime(audio.currentTime);
      const dur = audio.duration || audioTotalDuration;
      if (dur > 0) {
        setVoiceProgress((audio.currentTime / dur) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlayingVoice(false);
      setVoiceProgress(0);
      setVoiceCurrentTime(0);
      soundtrackEngine.duck(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [voiceAudioUrl, audioTotalDuration]);

  const hasVoice = Boolean(voiceAudioUrl && (letterType === 'voice' || letterType === 'both'));
  const hasTyped = letterType === 'typed' || letterType === 'both' || !hasVoice;

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-16 text-center pb-28 sm:pb-24">
      {voiceAudioUrl && (
        <audio ref={audioRef} src={voiceAudioUrl} preload="auto" />
      )}

      {/* 1. CELEBRATORY TEXT */}
      <div className="max-w-xl mx-auto mb-8 sm:mb-10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 px-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#F2D7DC] text-xs font-semibold text-[#8B1E3F] shadow-sm mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Celebrating You Today</span>
          <Heart className="w-3 h-3 fill-[#8B1E3F] text-[#8B1E3F]" />
        </div>

        <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-[#4A1525] tracking-tight leading-tight mb-3 break-words">
          Happy Celebration, <br />
          <span className="italic font-normal text-[#8B1E3F]">
            {celebrantDisplayName}
          </span>
        </h1>
        <p className="text-xs sm:text-base text-[#6E4F57] max-w-md mx-auto leading-relaxed">
          {isOpen
            ? 'Your personalized delivery is unsealed below. Enjoy every word and moment prepared especially for you.'
            : 'A personal delivery has arrived for you. Tap the luxury wax-sealed envelope below to open it.'}
        </p>
      </div>

      {/* 2. THE LUXURY 3D ENVELOPE */}
      <div className="relative my-2 sm:my-4 w-full max-w-md mx-auto flex flex-col items-center px-2">
        <div
          onClick={handleEnvelopeClick}
          className={`group relative w-[270px] sm:w-84 max-w-[88vw] h-44 sm:h-56 transition-all duration-700 transform cursor-pointer select-none ${
            isOpen ? 'scale-95 opacity-90' : 'hover:scale-105 active:scale-95'
          } ${isUnsealing ? 'animate-bounce' : ''}`}
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#EED5D9]/40 via-[#F5E6D8]/30 to-[#EED5D9]/40 rounded-3xl blur-xl transition-all group-hover:blur-2xl" />

          <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-[#FDFBF7] to-[#F5ECE5] border-2 border-[#E5D2C5] shadow-xl overflow-hidden flex flex-col justify-between p-4 sm:p-6">
            {/* Top Flap */}
            <div
              className={`absolute top-0 left-0 right-0 h-20 sm:h-24 bg-gradient-to-b from-[#EFE3D8] to-[#E5D4C5] border-b border-[#D8C2B0] transition-all duration-700 origin-top shadow-md flex items-center justify-center ${
                isOpen ? '-rotate-180 -translate-y-2 opacity-0' : 'rotate-0'
              }`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            >
              <div className="absolute bottom-2 w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-gradient-to-br from-[#A62B50] via-[#8B1E3F] to-[#591026] text-white flex items-center justify-center shadow-lg border border-[#D4AF37]/50 transform hover:scale-110 transition-transform">
                <Heart className="w-4 sm:w-5 h-4 sm:h-5 fill-white/90 text-white" />
              </div>
            </div>

            {/* Letter Inside Peeking Up */}
            <div
              className={`absolute left-4 sm:left-6 right-4 sm:right-6 top-8 bg-[#FFFDF9] rounded-t-lg border border-[#EADBDA] shadow-inner transition-all duration-700 p-2.5 sm:p-3 text-left ${
                isOpen ? '-translate-y-12 opacity-0' : 'translate-y-4 opacity-75'
              }`}
            >
              <div className="w-12 h-1 bg-[#8B1E3F]/30 rounded-full mb-1.5" />
              <div className="w-24 h-1 bg-[#8B1E3F]/20 rounded-full mb-1" />
              <div className="w-16 h-1 bg-[#8B1E3F]/15 rounded-full" />
            </div>

            <div className="mt-auto z-10 flex flex-col items-center">
              <span className="font-serif italic text-xs sm:text-sm text-[#8B1E3F] tracking-wide">
                Special Delivery
              </span>
              <span className="font-serif font-bold text-sm sm:text-base text-[#4A1525] truncate max-w-[200px]">
                {celebrantDisplayName}
              </span>
            </div>

            <div className="absolute top-2 left-2 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-l-2 border-[#D4AF37]/60" />
            <div className="absolute top-2 right-2 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-r-2 border-[#D4AF37]/60" />
            <div className="absolute bottom-2 left-2 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-l-2 border-[#D4AF37]/60" />
            <div className="absolute bottom-2 right-2 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-r-2 border-[#D4AF37]/60" />
          </div>
        </div>

        {!isOpen && (
          <button
            type="button"
            onClick={handleEnvelopeClick}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#8B1E3F] text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-[#721532] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <MailOpen className="w-4 h-4" />
            <span>Tap to Unseal Your Delivery</span>
          </button>
        )}
      </div>

      {/* 3. UNSEALED LETTER & VOICE PLAYER */}
      {isOpen && (
        <div
          id="handwritten-epistle"
          className="w-full max-w-3xl mx-auto mt-8 sm:mt-12 transition-all duration-1000 animate-in fade-in slide-in-from-bottom-8 text-left space-y-6 px-1"
        >
          {/* VOICE NOTE PLAYER BAR (If letterType is 'both' or 'voice') */}
          {hasVoice && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-[#8B1E3F]/25 shadow-lg shadow-[#8B1E3F]/5 p-3.5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 transition-all">
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={toggleVoicePlayback}
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#8B1E3F] to-[#B3294E] hover:from-[#721532] hover:to-[#961F40] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#8B1E3F]/30 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                  title={isPlayingVoice ? 'Pause voice note' : 'Play voice note'}
                  aria-label={isPlayingVoice ? 'Pause voice note' : 'Play voice note'}
                >
                  {isPlayingVoice ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-xs font-bold text-[#4A1525] uppercase tracking-wider">
                      {isPlayingVoice ? 'Speaking To You...' : 'Personal Voice Note'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F2] text-[#8B1E3F] border border-[#F5CDD3] inline-flex items-center gap-1">
                      <Mic className="w-2.5 h-2.5 text-[#8B1E3F]" />
                      <span>Spoken Epistle</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C6B73] mt-0.5 truncate">
                    {isPlayingVoice
                      ? 'Listen closely as words are spoken from the heart...'
                      : 'Tap play to listen to their voice reading this letter'}
                  </p>
                </div>
              </div>

              {/* Dynamic Interactive Waveform Display */}
              <div className="flex-1 min-w-[200px] w-full max-w-md bg-[#FAF7F2] p-2 sm:p-3 rounded-2xl border border-[#EADBDA]/80 shadow-inner">
                <AudioWaveformVisualizer
                  isPlaying={isPlayingVoice}
                  progressPercent={voiceProgress}
                  currentSeconds={voiceCurrentTime}
                  durationSeconds={audioTotalDuration}
                  onSeek={handleVoiceSeek}
                  barCount={36}
                />
              </div>
            </div>
          )}

          {/* PARCHMENT LETTER (If typed or both) */}
          {hasTyped && (
            <div className="relative bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#EADBDA] shadow-xl p-5 sm:p-10 md:p-14 overflow-hidden">
              {/* Vertical red margin line - safely indented */}
              <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-[#F4DCD9]/80 pointer-events-none" />

              {/* Letter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 sm:pb-6 border-b border-[#F0DFDE] mb-6 sm:mb-8 pl-3 sm:pl-6">
                <div>
                  <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#9E5D6C] font-semibold">
                    A Personalized Epistle
                  </span>
                  <h2 className="font-serif text-xl sm:text-3xl font-bold text-[#4A1525] break-words">
                    To My Dearest {celebrantDisplayName} ❤️
                  </h2>
                </div>

                {onOpenExportModal && (
                  <button
                    type="button"
                    onClick={onOpenExportModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white hover:bg-[#FFF0F2] border border-[#E5B8C0] text-[#8B1E3F] text-xs font-semibold transition-all cursor-pointer shadow-xs self-start sm:self-auto hover:shadow-md"
                    title="Export or print this letter as a keepsake PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#8B1E3F]" />
                    <span>Download Keepsake PDF</span>
                  </button>
                )}
              </div>

              {/* Flowing Epistle Paragraphs - Generous, beautiful typography */}
              <div className="space-y-5 sm:space-y-7 pl-3 sm:pl-6 text-[#2E181F] text-base sm:text-lg leading-relaxed font-sans font-light">
                {cleanParagraphs.map((paragraph, index) => (
                  <p
                    key={`para-${index}`}
                    className="first-letter:font-serif first-letter:text-2xl sm:first-letter:text-3xl first-letter:font-semibold first-letter:text-[#8B1E3F] break-words"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Signoff */}
              <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-[#F0DFDE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-3 sm:pl-6">
                <div>
                  <p className="font-serif italic text-base sm:text-xl text-[#8B1E3F]">
                    Forever celebrating you,
                  </p>
                  <p className="font-serif font-bold text-xs sm:text-sm text-[#5C2A36]">
                    With all my genuine love & prayers ❤️
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-2xl bg-[#FFF5F6] border border-[#F5CDD3] text-xs font-semibold text-[#8B1E3F]">
                  <Heart className="w-3.5 h-3.5 fill-[#8B1E3F]" />
                  <span>Written Especially for You</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. SCRAPBOOK PHOTO GALLERY & CAROUSEL */}
          {galleryPhotos && galleryPhotos.length > 0 && (
            <div className="mt-12 sm:mt-16">
              <PhotoCarousel photos={galleryPhotos} recipientName={recipientName} />
            </div>
          )}

          {/* 5. FINALE EXACT REVEAL MESSAGE */}
          <div className="my-12 sm:my-16 py-8 sm:py-12 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FFF5F6] via-[#FAF7F2] to-[#FFF0F2] border border-[#F2D7DC] text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-[#8B1E3F] text-white shadow-md mb-4 sm:mb-5">
              <Sparkles className="w-6 sm:w-7 h-6 sm:h-7" />
            </div>
            <h3 className="font-serif text-xl sm:text-3xl md:text-4xl font-extrabold text-[#4A1525] tracking-tight leading-snug max-w-xl mx-auto break-words px-2">
              {finaleMessage}
            </h3>
            <p className="text-xs sm:text-sm text-[#8C6B73] mt-3 max-w-md mx-auto">
              May this celebration bring endless joy, grace, peace, and unforgettable happiness.
            </p>

            {onOpenExportModal && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={onOpenExportModal}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Digital Epistle (PDF Keepsake)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
