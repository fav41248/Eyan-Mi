import React, { useEffect, useRef } from 'react';
import { EpistleParagraph } from '../types';
import { Heart, Sparkles, Feather, Play, CheckCircle2, Bookmark } from 'lucide-react';

interface EpistleSectionProps {
  paragraphs: EpistleParagraph[];
  activeParagraphId: string | null;
  synchronizedTimingAvailable: boolean;
  isAutoScrollEnabled: boolean;
  onParagraphClick: (paragraph: EpistleParagraph) => void;
  onOpenEpistleVault: () => void;
  recipientName: string;
}

export const EpistleSection: React.FC<EpistleSectionProps> = ({
  paragraphs,
  activeParagraphId,
  synchronizedTimingAvailable,
  isAutoScrollEnabled,
  onParagraphClick,
  onOpenEpistleVault,
  recipientName,
}) => {
  const activeParagraphRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll into view when active paragraph changes
  useEffect(() => {
    if (activeParagraphId && isAutoScrollEnabled && activeParagraphRef.current) {
      activeParagraphRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeParagraphId, isAutoScrollEnabled]);

  return (
    <section id="epistle-section" className="relative py-12 sm:py-20 px-4 sm:px-6 max-w-3xl mx-auto">
      {/* Decorative header ribbon */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF0F2] border border-[#F4CED4] shadow-sm mb-4">
          <Feather className="w-5 h-5 text-[#8B1E3F]" />
        </div>
        
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#9E5D6C] font-medium mb-1">
          <span>The Birthday Epistle</span>
          <span aria-hidden="true">·</span>
          <span>Written for Precious</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#4A1525] tracking-tight mb-4">
          A Letter For {recipientName}
        </h2>

        <p className="text-sm sm:text-base text-[#6E4F57] max-w-lg mx-auto font-light leading-relaxed">
          Read slowly, or listen as each spoken word guides your heart through these paragraphs.
        </p>

        {/* Sync Mode indicator & quick update button */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#FAF2F2] border border-[#F0D5D8] text-[#8C5D67]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>
              {synchronizedTimingAvailable
                ? 'Voice narration synchronized · Tap any paragraph to jump'
                : 'Complete letter reading mode'}
            </span>
          </span>

          <button
            type="button"
            onClick={onOpenEpistleVault}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white hover:bg-[#FFF5F6] border border-[#E5B8C0] text-[#8B1E3F] transition-colors cursor-pointer shadow-xs"
            title="Edit or paste epistle text & timestamps"
          >
            <Feather className="w-3.5 h-3.5 text-[#C07D85]" />
            <span>Paste / Edit Epistle</span>
          </button>
        </div>
      </div>

      {/* Romantic Digital Parchment Paper Container */}
      <div className="relative rounded-3xl bg-white/95 p-6 sm:p-12 border border-[#EADBDA] shadow-xl shadow-[#4A1525]/5">
        
        {/* Subtle washi tape decorative header */}
        <div className="washi-tape-top washi-tape-gold opacity-80" />

        {/* Delicate golden bookmark indicator */}
        <div className="absolute top-0 right-8 w-6 h-10 bg-[#D4AF37]/30 border-b border-x border-[#D4AF37]/50 rounded-b-md flex items-center justify-center">
          <Bookmark className="w-3 h-3 text-[#7A5B0F]" />
        </div>

        {/* Epistle Paragraphs List */}
        <div className="space-y-8 sm:space-y-10">
          {paragraphs.map((para, index) => {
            const isActive = activeParagraphId === para.id;

            return (
              <article
                key={para.id}
                ref={isActive ? activeParagraphRef : null}
                onClick={() => onParagraphClick(para)}
                className={`group relative p-5 sm:p-7 rounded-2xl transition-all duration-500 cursor-pointer ${
                  isActive
                    ? 'bg-[#FFF7F8] border-l-4 border-[#8B1E3F] shadow-md shadow-[#8B1E3F]/5 ring-1 ring-[#F8D2D8]'
                    : 'hover:bg-[#FAF6F5] border-l-4 border-transparent'
                }`}
              >
                {/* Note / Chapter header if present */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs uppercase tracking-wider font-medium text-[#9E5D6C]">
                    {para.note || `Section ${index + 1}`}
                  </span>

                  {/* Audio sync indicator / jump button */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono transition-opacity ${
                      isActive
                        ? 'text-[#8B1E3F] font-semibold opacity-100'
                        : 'text-[#A07E86] opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{typeof para.startTime === 'number' ? `${Math.floor(para.startTime / 60)}:${(para.startTime % 60).toString().padStart(2, '0')}` : 'Listen'}</span>
                  </span>
                </div>

                {/* Paragraph Content: Preserved exactly without modification */}
                <p className="text-base sm:text-lg md:text-[19px] text-[#332226] font-normal leading-relaxed sm:leading-loose whitespace-pre-line select-text">
                  {para.text}
                </p>

                {/* Active Indicator Icon */}
                {isActive && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#8B1E3F] text-white flex items-center justify-center shadow-md animate-bounce">
                    <Heart className="w-3 h-3 fill-white" />
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Epistle Closing Signature */}
        <div className="mt-12 pt-8 border-t border-[#F0DEDB] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E5D6C] font-medium">With Endless Affection</p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-[#4A1525]">Yours Always</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8C6B73] bg-[#FAF3F2] px-4 py-2 rounded-xl border border-[#F2DFE2]">
            <CheckCircle2 className="w-4 h-4 text-[#8B1E3F]" />
            <span>Preserved in authentic digital script</span>
          </div>
        </div>
      </div>
    </section>
  );
};
