import React from 'react';
import { Heart, Sparkles, Music, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  recipientName: string;
  nickname: string;
  onStartReading: () => void;
  onPlayNarration: () => void;
  isPlaying: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  recipientName,
  nickname,
  onStartReading,
  onPlayNarration,
  isPlaying,
}) => {
  return (
    <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-[#FCE6E9]/50 blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-[#F5E2C8]/30 blur-3xl pointer-events-none" />

      {/* Scrapbook Stamp / Crest */}
      <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 border-[#EADBDA] shadow-xl shadow-[#4A1525]/5 flex items-center justify-center relative mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#FFF0F2] to-[#FCE6E9] flex items-center justify-center">
          <Heart className="w-9 h-9 sm:w-11 sm:h-11 text-[#8B1E3F] fill-[#F8D2D8]" />
        </div>
        <Sparkles className="w-5 h-5 text-[#D4AF37] absolute -top-1 -right-1" />
      </div>

      {/* Editorial subtitle kicker */}
      <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#9E5D6C] font-semibold mb-3">
        <span>To My Dearest</span>
        <span aria-hidden="true">·</span>
        <span>A Celebration of Grace</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black text-[#4A1525] tracking-tight leading-[1.08] mb-6">
        Oluwapreciousimi
      </h1>

      <p className="text-xl sm:text-2xl font-serif italic text-[#8B1E3F] mb-6">
        "Precious in name, precious in spirit, endlessly cherished."
      </p>

      <p className="text-sm sm:text-base text-[#6E4F57] max-w-lg mx-auto font-light leading-relaxed mb-10">
        Today we celebrate your beauty, your joyful laughter, and the kindness you breathe into the world. Welcome to your digital birthday scrapbook and keepsake.
      </p>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
        <button
          type="button"
          onClick={onPlayNarration}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#8B1E3F] to-[#A62B50] text-white font-medium text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
        >
          <Music className="w-4 h-4 text-[#FFD2DC]" />
          <span>{isPlaying ? 'Pause Narration' : 'Listen To Voice Narration'}</span>
        </button>

        <button
          type="button"
          onClick={onStartReading}
          className="px-6 py-3.5 rounded-2xl bg-white border border-[#EADBDA] text-[#4A1525] hover:border-[#8B1E3F] font-medium text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <span>Read Epistle</span>
          <ChevronDown className="w-4 h-4 text-[#8B1E3F]" />
        </button>
      </div>

      {/* Scrapbook tape accent line */}
      <div className="w-24 h-0.5 bg-[#D4AF37]/40 mx-auto rounded-full" />
    </section>
  );
};
