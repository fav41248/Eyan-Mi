import React from 'react';
import { Sparkles, Feather } from 'lucide-react';

interface TopBarProps {
  onOpenVault: () => void;
  onTriggerBurst: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenVault, onTriggerBurst }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EADBDA]/80">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#4A1525] hover:opacity-80 transition-opacity whitespace-nowrap"
      >
        For Oluwapreciousimi ❤️
      </a>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider font-medium text-[#7C5A63]">
        <a href="#epistle-section" className="hover:text-[#8B1E3F] transition-colors">
          Epistle
        </a>
        <a href="#gallery-section" className="hover:text-[#8B1E3F] transition-colors">
          Scrapbook
        </a>
        <a href="#video-section" className="hover:text-[#8B1E3F] transition-colors">
          Reels
        </a>
        <a href="#finale-section" className="hover:text-[#8B1E3F] transition-colors">
          Celebration
        </a>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenVault}
          className="px-3 py-1.5 text-xs font-medium text-[#7C5A63] hover:text-[#4A1525] bg-white border border-[#EADBDA] rounded-xl hover:bg-[#FFF7F8] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          title="Manage Epistle & Media"
        >
          <Feather className="w-3.5 h-3.5 text-[#8B1E3F]" />
          <span>Epistle Vault</span>
        </button>

        <button
          type="button"
          onClick={onTriggerBurst}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#8B1E3F] hover:bg-[#A62B50] rounded-xl shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FFD2DC]" />
          <span>Celebrate</span>
        </button>
      </div>
    </header>
  );
};
