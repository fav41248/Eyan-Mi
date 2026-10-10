import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart,
  Sparkles,
  ArrowRight,
  Mic,
  Music,
  FileText,
  Mail,
  Shield,
  CheckCircle,
  Play,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';

interface LandingPageProps {
  onStartCreating: () => void;
  onOpenSample: () => void;
  onGoToDashboard: () => void;
  onOpenAuth: () => void;
  onGoToAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCreating,
  onOpenSample,
  onGoToDashboard,
  onOpenAuth,
  onGoToAdmin,
}) => {
  const { user, userProfile, isAdmin } = useAuth();
  const [activeFeatureTab, setActiveFeatureTab] = useState<'letter' | 'voice' | 'music' | 'unseal'>('letter');

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241318] flex flex-col font-sans selection:bg-[#FCE8EB] selection:text-[#8B1E3F]">
      {/* Top Luxury Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#EADBDA] px-4 sm:px-8 py-4 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B1E3F] via-[#A62B50] to-[#D4AF37] flex items-center justify-center text-white shadow-sm">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#4A1525] tracking-tight">
              Eyan mi
            </span>
            <span className="hidden sm:inline-block text-[11px] text-[#8C6B73] ml-2 font-medium">
              · Celebrate your person
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#6E4F57]">
          <a href="#how-it-works" className="hover:text-[#8B1E3F] transition-colors">
            How It Works
          </a>
          <a href="#features" className="hover:text-[#8B1E3F] transition-colors">
            Features
          </a>
          <button
            type="button"
            onClick={onOpenSample}
            className="hover:text-[#8B1E3F] transition-colors cursor-pointer"
          >
            Live Sample
          </button>
        </nav>

        <div className="flex items-center gap-2.5">
          {isAdmin && onGoToAdmin && (
            <button
              type="button"
              onClick={onGoToAdmin}
              className="px-3 py-2 rounded-xl bg-[#8B1E3F] text-white text-xs font-bold hover:bg-[#721532] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}

          {user || userProfile ? (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-4 py-2 rounded-xl bg-[#FFF0F2] border border-[#F5CDD3] text-[#8B1E3F] text-xs font-bold hover:bg-[#FCE6E9] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>My Studio</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl border border-[#EADBDA] bg-white text-[#4A1525] text-xs font-semibold hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onStartCreating}
            className="px-5 py-2 rounded-xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Create Celebration</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-8 max-w-6xl mx-auto text-center overflow-hidden">
        {/* Subtle Ambient Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#FCE8EB]/60 via-[#F5E6D8]/50 to-[#FCE8EB]/60 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-[#F2D7DC] text-xs font-semibold text-[#8B1E3F] shadow-sm mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>The Luxury Digital Celebration Platform</span>
          <Heart className="w-3.5 h-3.5 fill-[#8B1E3F]" />
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-[#4A1525] tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6">
          Celebrate your person. <br />
          <span className="italic font-normal text-[#8B1E3F]">
            Immortalize your love.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-[#6E4F57] max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Transform your heartfelt words, voice recording, memories, and photos into a stunning, interactive 3D wax-sealed celebration experience.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
          <button
            type="button"
            onClick={onStartCreating}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start a Celebration</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenSample}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-[#FFFDFB] text-[#4A1525] border border-[#EADBDA] text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 text-[#8B1E3F] fill-[#8B1E3F]" />
            <span>Experience Live Sample</span>
          </button>
        </div>

        {/* Interactive Visual Envelope Showcase */}
        <div className="relative max-w-3xl mx-auto rounded-3xl border border-[#E5D2C5] bg-gradient-to-b from-[#FDFBF7] to-[#F5ECE5] p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-8 text-left">
            {/* 3D Wax Seal Envelope Teaser */}
            <div className="w-48 h-36 sm:w-60 sm:h-44 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#EFE3D8] border-2 border-[#D8C2B0] shadow-xl relative flex flex-col items-center justify-center p-4 cursor-pointer hover:scale-105 transition-transform shrink-0" onClick={onOpenSample}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A62B50] to-[#8B1E3F] text-white flex items-center justify-center shadow-md border border-[#D4AF37]/50 mb-2">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <span className="font-serif italic text-xs text-[#8B1E3F]">
                Special Delivery
              </span>
              <span className="font-serif font-bold text-sm text-[#4A1525]">
                Tap to Unseal
              </span>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#EADBDA] text-[11px] font-semibold text-[#8B1E3F]">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>What Your Celebrant Experiences</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#4A1525]">
                An Unboxing They Will Never Forget
              </h3>
              <p className="text-xs sm:text-sm text-[#6E4F57] leading-relaxed">
                1. Animated memory filmstrip cycling cherished moments. <br />
                2. Tap the royal wax seal to burst confetti and unseal the letter. <br />
                3. Listen to your recorded voice while reading the letter. <br />
                4. Cherished scrapbook polaroids & celebratory fireworks!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 bg-white border-y border-[#EADBDA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
              Simple & Intimate
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A1525] mt-1">
              How Eyan mi Works
            </h2>
            <p className="text-xs sm:text-sm text-[#8C6B73] mt-2">
              Three easy steps to immortalize how much someone means to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#EADBDA] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8B1E3F] text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                1
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4A1525]">
                Choose Your Person & Milestone
              </h3>
              <p className="text-xs sm:text-sm text-[#6E4F57] leading-relaxed">
                Whether it’s their birthday, your anniversary, or an appreciation letter just because—personalize their name, affectionate nicknames, and custom headlines.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#EADBDA] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8B1E3F] text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                2
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4A1525]">
                Letter, Voice & Soundscapes
              </h3>
              <p className="text-xs sm:text-sm text-[#6E4F57] leading-relaxed">
                Write it yourself or let Eyan Mi AI Epistle co-write heartfelt poetry. Record your own voice reading the letter, and pick an ambient background soundscape or pure intimacy.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF7F2] border border-[#EADBDA] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8B1E3F] text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
                3
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4A1525]">
                Share the Wax-Sealed Delivery
              </h3>
              <p className="text-xs sm:text-sm text-[#6E4F57] leading-relaxed">
                Send your unique delivery link over WhatsApp, Instagram, or message. They open a private 3D wax envelope with confetti and handwritten keepsakes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section id="features" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
            Designed for Emotion
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A1525] mt-1">
            Everything You Need to Celebrate Them
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#EADBDA] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#8B1E3F] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A1525]">
              Eyan Mi AI Epistle & Handwritten Letters
            </h4>
            <p className="text-xs text-[#6E4F57] leading-relaxed">
              Write straight from your soul or let the Eyan Mi AI Epistle turn memories, nicknames, and emotions into eloquent, lyrical poetry.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EADBDA] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A1525]">
              Real Voice Recording
            </h4>
            <p className="text-xs text-[#6E4F57] leading-relaxed">
              Nothing touches the heart like your real voice. Record your voice note directly from your phone or laptop with smooth playback.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EADBDA] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A1525]">
              Curated Soundscapes
            </h4>
            <p className="text-xs text-[#6E4F57] leading-relaxed">
              No annoying default noise. Pick from soft acoustic grand piano, lo-fi sunset romance, celestial harp, custom MP3s, or pure quiet.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EADBDA] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A1525]">
              Interactive 3D Wax Unboxing
            </h4>
            <p className="text-xs text-[#6E4F57] leading-relaxed">
              A luxury wax seal that unseals with celebratory sound and falling confetti hearts for an enchanting surprise.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EADBDA] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A1525]">
              Photo Polaroids & Scrapbook
            </h4>
            <p className="text-xs text-[#6E4F57] leading-relaxed">
              Add opening memory photos that cycle like film reels, plus vintage polaroid keepsakes with colorful washi tape and captions.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EADBDA] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A1525]">
              Private Accounts & Cloud Safety
            </h4>
            <p className="text-xs text-[#6E4F57] leading-relaxed">
              Each user manages their own personal dashboard, unique delivery links, and keepsakes backed up permanently in the cloud.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-20 px-4 sm:px-8 bg-gradient-to-br from-[#8B1E3F] via-[#721532] to-[#4A1525] text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#F2D7DC]">
            <Heart className="w-3.5 h-3.5 fill-[#F2D7DC]" />
            <span>Make Today Unforgettable</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
            Who is your person?
          </h2>

          <p className="text-sm sm:text-base text-[#F5E6D8] max-w-xl mx-auto font-light leading-relaxed">
            Don’t settle for generic birthday texts. Send them an interactive keepsake letter that shows how much they truly mean to you.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartCreating}
              className="px-8 py-3.5 rounded-2xl bg-white text-[#8B1E3F] hover:bg-[#FAF7F2] text-sm font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Create Celebration Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#EADBDA] py-10 px-4 sm:px-8 text-center text-xs text-[#8C6B73]">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#8B1E3F] text-white flex items-center justify-center">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="font-serif text-base font-bold text-[#4A1525]">Eyan mi</span>
          </div>
          <p className="font-serif italic text-sm text-[#6E4F57]">
            "Eniyan l'aso mi" — People are our greatest clothing and treasure.
          </p>
          <p>© {new Date().getFullYear()} Eyan mi. Celebrating cherished moments and digital epistles.</p>
        </div>
      </footer>
    </div>
  );
};
