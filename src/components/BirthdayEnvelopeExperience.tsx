import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Heart, MailOpen, Play, Pause, Volume2, Mic } from 'lucide-react';
import { EpistleParagraph, GalleryPhoto, LetterType } from '../types';
import { PhotoGallery } from './PhotoGallery';
import { soundtrackEngine } from '../utils/audioEngine';

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
}) => {
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setVoiceProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlayingVoice(false);
      setVoiceProgress(0);
      soundtrackEngine.duck(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [voiceAudioUrl]);

  const hasVoice = Boolean(voiceAudioUrl && (letterType === 'voice' || letterType === 'both'));
  const hasTyped = letterType === 'typed' || letterType === 'both' || !hasVoice;

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-10 sm:py-16 text-center">
      {voiceAudioUrl && (
        <audio ref={audioRef} src={voiceAudioUrl} preload="auto" />
      )}

      {/* 1. CELEBRATORY TEXT */}
      <div className="max-w-xl mx-auto mb-10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#F2D7DC] text-xs font-semibold text-[#8B1E3F] shadow-sm mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Celebrating You Today</span>
          <Heart className="w-3 h-3 fill-[#8B1E3F] text-[#8B1E3F]" />
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#4A1525] tracking-tight leading-tight mb-3">
          Happy Celebration, <br />
          <span className="italic font-normal text-[#8B1E3F]">
            {celebrantDisplayName}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-[#6E4F57] max-w-md mx-auto leading-relaxed">
          {isOpen
            ? 'Your personalized delivery is unsealed below. Enjoy every word and moment prepared especially for you.'
            : 'A personal delivery has arrived for you. Tap the luxury wax-sealed envelope below to open it.'}
        </p>
      </div>

      {/* 2. THE LUXURY 3D ENVELOPE */}
      <div className="relative my-4 w-full max-w-md mx-auto flex flex-col items-center">
        <div
          onClick={handleEnvelopeClick}
          className={`group relative w-72 sm:w-84 h-48 sm:h-56 transition-all duration-700 transform cursor-pointer select-none ${
            isOpen ? 'scale-95 opacity-90' : 'hover:scale-105 active:scale-95'
          } ${isUnsealing ? 'animate-bounce' : ''}`}
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#EED5D9]/40 via-[#F5E6D8]/30 to-[#EED5D9]/40 rounded-3xl blur-xl transition-all group-hover:blur-2xl" />

          <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-[#FDFBF7] to-[#F5ECE5] border-2 border-[#E5D2C5] shadow-xl overflow-hidden flex flex-col justify-between p-6">
            {/* Top Flap */}
            <div
              className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#EFE3D8] to-[#E5D4C5] border-b border-[#D8C2B0] transition-all duration-700 origin-top shadow-md flex items-center justify-center ${
                isOpen ? '-rotate-180 -translate-y-2 opacity-0' : 'rotate-0'
              }`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            >
              <div className="absolute bottom-2 w-11 h-11 rounded-full bg-gradient-to-br from-[#A62B50] via-[#8B1E3F] to-[#591026] text-white flex items-center justify-center shadow-lg border border-[#D4AF37]/50 transform hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 fill-white/90 text-white" />
              </div>
            </div>

            {/* Letter Inside Peeking Up */}
            <div
              className={`absolute left-6 right-6 top-8 bg-[#FFFDF9] rounded-t-lg border border-[#EADBDA] shadow-inner transition-all duration-700 p-3 text-left ${
                isOpen ? '-translate-y-12 opacity-0' : 'translate-y-4 opacity-75'
              }`}
            >
              <div className="w-12 h-1 bg-[#8B1E3F]/30 rounded-full mb-1.5" />
              <div className="w-24 h-1 bg-[#8B1E3F]/20 rounded-full mb-1" />
              <div className="w-16 h-1 bg-[#8B1E3F]/15 rounded-full" />
            </div>

            <div className="mt-auto z-10 flex flex-col items-center">
              <span className="font-serif italic text-sm text-[#8B1E3F] tracking-wide">
                Special Delivery
              </span>
              <span className="font-serif font-bold text-base text-[#4A1525]">
                {celebrantDisplayName}
              </span>
            </div>

            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/60" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]/60" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]/60" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/60" />
          </div>
        </div>

        {!isOpen && (
          <button
            type="button"
            onClick={handleEnvelopeClick}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#8B1E3F] text-white text-sm font-semibold shadow-md hover:bg-[#721532] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
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
          className="w-full max-w-3xl mx-auto mt-12 transition-all duration-1000 animate-in fade-in slide-in-from-bottom-8 text-left space-y-6"
        >
          {/* VOICE NOTE PLAYER BAR (If letterType is 'both' or 'voice') */}
          {hasVoice && (
            <div className="bg-white rounded-2xl border-2 border-[#8B1E3F]/20 shadow-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleVoicePlayback}
                  className="w-12 h-12 rounded-full bg-[#8B1E3F] hover:bg-[#721532] text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform transform active:scale-95"
                  title={isPlayingVoice ? 'Pause voice note' : 'Play voice note'}
                >
                  {isPlayingVoice ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4A1525] uppercase tracking-wider">
                      {isPlayingVoice ? 'Speaking Now...' : 'Personal Voice Note'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F2] text-[#8B1E3F] border border-[#F5CDD3]">
                      🎙️ Spoken Epistle
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C6B73] mt-0.5">
                    {isPlayingVoice
                      ? 'Listen closely as words are spoken from the heart...'
                      : 'Tap play to listen to their voice reading this letter'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-[#F2EAE5] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#8B1E3F] h-full transition-all duration-200"
                    style={{ width: `${voiceProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PARCHMENT LETTER (If typed or both) */}
          {hasTyped && (
            <div className="relative bg-[#FFFDF9] rounded-3xl border border-[#EADBDA] shadow-xl p-8 sm:p-14 overflow-hidden">
              <div className="absolute left-6 sm:left-10 top-0 bottom-0 w-0.5 bg-[#F4DCD9]/80 pointer-events-none" />

              {/* Letter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0DFDE] mb-8">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#9E5D6C] font-semibold">
                    A Personalized Epistle
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A1525]">
                    To My Dearest {celebrantDisplayName} ❤️
                  </h2>
                </div>
              </div>

              {/* Flowing Epistle Paragraphs */}
              <div className="space-y-6 sm:space-y-7 pl-4 sm:pl-6 text-[#2E181F] text-base sm:text-lg leading-relaxed font-sans font-light">
                {cleanParagraphs.map((paragraph, index) => (
                  <p
                    key={`para-${index}`}
                    className="first-letter:font-serif first-letter:text-2xl first-letter:font-semibold first-letter:text-[#8B1E3F]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Signoff */}
              <div className="mt-12 pt-8 border-t border-[#F0DFDE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-serif italic text-lg sm:text-xl text-[#8B1E3F]">
                    Forever celebrating you,
                  </p>
                  <p className="font-serif font-bold text-sm text-[#5C2A36]">
                    With all my genuine love & prayers ❤️
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-2xl bg-[#FFF5F6] border border-[#F5CDD3] text-xs font-semibold text-[#8B1E3F]">
                  <Heart className="w-3.5 h-3.5 fill-[#8B1E3F]" />
                  <span>Written Especially for You</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. SCRAPBOOK PHOTO GALLERY */}
          {galleryPhotos && galleryPhotos.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#8B1E3F]">
                  Cherished Keepsakes
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A1525] mt-1">
                  Captured Moments & Smiles
                </h3>
              </div>
              <PhotoGallery photos={galleryPhotos} />
            </div>
          )}

          {/* 5. FINALE EXACT REVEAL MESSAGE */}
          <div className="my-16 py-12 px-6 rounded-3xl bg-gradient-to-br from-[#FFF5F6] via-[#FAF7F2] to-[#FFF0F2] border border-[#F2D7DC] text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#8B1E3F] text-white shadow-md mb-5">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#4A1525] tracking-tight leading-snug max-w-xl mx-auto">
              {finaleMessage}
            </h3>
            <p className="text-xs sm:text-sm text-[#8C6B73] mt-3">
              May this celebration bring endless joy, grace, peace, and unforgettable happiness.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
