import React, { useState } from 'react';
import { Heart, Sparkles, Music2, Gift } from 'lucide-react';

interface OpeningScreenProps {
  onOpen: () => void;
  recipientName: string;
  nickname: string;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({
  onOpen,
  recipientName,
  nickname,
}) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleStart = () => {
    setIsOpening(true);
    setTimeout(() => {
      onOpen();
    }, 700);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-700 ${
        isOpening ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      } paper-texture`}
      style={{
        background: 'radial-gradient(circle at center, #FFF9F7 0%, #F8EFEA 60%, #EFE1DB 100%)',
      }}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#FAD2D8]/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-[#EED8A1]/20 blur-3xl pointer-events-none" />

      {/* Main Invitation Card Container */}
      <div className="relative max-w-md w-full mx-auto p-8 sm:p-10 rounded-3xl bg-white/90 backdrop-blur-md shadow-2xl shadow-[#4A1525]/10 border border-[#EADBDA] text-center">
        {/* Top Decorative Gold Badge */}
        <div className="washi-tape-top washi-tape-gold" />

        {/* Delicate floral / heart crest */}
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-[#FFF0F2] to-[#FCE6E9] border border-[#F3C4CC] flex items-center justify-center shadow-inner mb-6 relative">
          <Heart className="w-8 h-8 text-[#A8324F] fill-[#E5738E] animate-pulse" />
          <Sparkles className="w-4 h-4 text-[#D4AF37] absolute -top-1 -right-1" />
        </div>

        {/* Subtitle kicker */}
        <div className="flex items-center justify-center gap-2 text-xs tracking-widest uppercase font-medium text-[#9E5D6C] mb-2">
          <span>A Birthday Keepsake</span>
          <span aria-hidden="true">·</span>
          <span>Crafted With Love</span>
        </div>

        {/* Title: EXACTLY "For Oluwapreciousimi ❤️" */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#4A1525] tracking-tight leading-tight mb-3">
          For {recipientName} <span className="text-[#C0264D] inline-block animate-bounce">❤️</span>
        </h1>

        {/* Personal affectionate note */}
        <p className="text-sm sm:text-base text-[#6E4F57] leading-relaxed mb-6 font-light max-w-xs mx-auto">
          Every memory, every prayer, and every unspoken beat of gratitude, gathered into a digital birthday letter for my dearest <strong className="font-semibold text-[#8B233D]">{nickname}</strong>.
        </p>

        {/* Audio interaction note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#9B777F] bg-[#FAF3F2] py-2 px-3 rounded-xl border border-[#F2DFE2] mb-7">
          <Music2 className="w-3.5 h-3.5 text-[#C07D85]" />
          <span>Includes personal voice narration & acoustic soundtrack</span>
        </div>

        {/* Primary Interactive CTA: "Open Your Surprise" */}
        <button
          onClick={handleStart}
          type="button"
          className="group relative w-full h-14 rounded-2xl bg-gradient-to-r from-[#8B1E3F] via-[#A62B50] to-[#8B1E3F] text-white font-medium text-base shadow-lg shadow-[#8B1E3F]/30 hover:shadow-xl hover:shadow-[#8B1E3F]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer overflow-hidden"
        >
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Gift className="w-5 h-5 text-[#FFD2DC] transition-transform group-hover:scale-110" />
          <span className="tracking-wide font-serif text-lg">Open Your Surprise</span>
          <Sparkles className="w-4 h-4 text-[#FFDF80] animate-spin" style={{ animationDuration: '6s' }} />
        </button>

        <p className="mt-4 text-[11px] text-[#A6888F]">
          Tap to begin the journey & activate sound
        </p>
      </div>
    </div>
  );
};
