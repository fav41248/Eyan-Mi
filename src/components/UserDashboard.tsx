import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { celebrationService } from '../lib/celebrationService';
import { CelebrationConfig } from '../types';
import {
  Heart,
  Plus,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  Shield,
  LogOut,
  Sparkles,
  Calendar,
  Mic,
  FileText,
  Music,
  ArrowRight,
  Globe,
  MessageCircle,
  Link2,
} from 'lucide-react';

interface UserDashboardProps {
  onCreateNew: () => void;
  onEditCelebration: (config: CelebrationConfig) => void;
  onPreviewCelebration: (id: string) => void;
  onGoToAdmin: () => void;
  onGoToLanding: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onCreateNew,
  onEditCelebration,
  onPreviewCelebration,
  onGoToAdmin,
  onGoToLanding,
}) => {
  const { user, userProfile, isAdmin, logout } = useAuth();
  const [celebrations, setCelebrations] = useState<CelebrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCelebrations = async () => {
    setLoading(true);
    try {
      const currentUid = user?.uid || userProfile?.uid;
      // Fetch celebrations for this user
      const list = await celebrationService.getAllCelebrations(currentUid);
      setCelebrations(list);
    } catch (err) {
      console.error('Failed to load user celebrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCelebrations();
  }, [user?.uid, userProfile?.uid]);

  const getCelebrationLink = (id: string) => {
    const base = window.location.origin.replace(/\/$/, '');
    return `${base}/c/${id}`;
  };

  const handleCopyLink = (id: string) => {
    const link = getCelebrationLink(id);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the celebration for "${name}"?`)) {
      return;
    }
    try {
      await celebrationService.deleteCelebration(id);
      setCelebrations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const displayName = userProfile?.displayName || user?.displayName || 'Creator';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241318] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#EADBDA] px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoToLanding}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B1E3F] to-[#D4AF37] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-[#4A1525] leading-tight">
                Eyan mi
              </div>
              <div className="text-[10px] text-[#8C6B73]">
                My Person · Celebration Platform
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              type="button"
              onClick={onGoToAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFF0F2] border border-[#F5CDD3] text-[#8B1E3F] text-xs font-bold hover:bg-[#FCE6E9] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin Panel</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#EADBDA]">
            <span className="text-xs font-medium text-[#4A1525]">
              {displayName}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-[#8C6B73] hover:text-[#4A1525] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#FFF5F6] via-white to-[#FAF7F2] border border-[#F2D7DC] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#F2D7DC] text-xs font-semibold text-[#8B1E3F]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Your Personal Celebration Studio</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A1525]">
              Welcome back, {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-[#6E4F57] leading-relaxed">
              Every person deserves to know how deeply cherished they are. Create personalized digital letters, record your voice, add custom romantic soundscapes, and craft memories that last forever.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="px-6 py-3.5 rounded-2xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-center shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Celebration</span>
          </button>
        </div>

        {/* Celebrations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#4A1525]">
                My Celebrations
              </h3>
              <p className="text-xs text-[#8C6B73]">
                People you’ve created personalized experiences for ({celebrations.length})
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[#8C6B73]">
              Loading your celebrations...
            </div>
          ) : celebrations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D5C2C6] bg-white p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#FFF0F2] text-[#8B1E3F] mx-auto flex items-center justify-center">
                <Heart className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-[#4A1525]">
                  No celebrations created yet
                </h4>
                <p className="text-xs text-[#8C6B73] max-w-sm mx-auto">
                  Celebrate someone you love! Write or AI-generate an epistle, record your voice reading it, and send a wax-sealed delivery link.
                </p>
              </div>
              <button
                type="button"
                onClick={onCreateNew}
                className="px-5 py-2.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Celebration</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {celebrations.map((c) => {
                const totalPhotos = (c.loaderPhotos?.length || 0) + (c.photos?.length || 0);
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-[#EADBDA] shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EADBDA] text-[11px] font-semibold text-[#8B1E3F]">
                          {c.occasion || 'Birthday'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8C6B73]">
                          {c.letterType === 'voice' && <Mic className="w-3.5 h-3.5 text-[#8B1E3F]" />}
                          {c.letterType === 'typed' && <FileText className="w-3.5 h-3.5 text-[#8B1E3F]" />}
                          {(!c.letterType || c.letterType === 'both') && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#8B1E3F]">
                              <FileText className="w-3 h-3" />
                              <Mic className="w-3 h-3" />
                            </span>
                          )}
                          <span className="capitalize">{c.letterType || 'Both'}</span>
                        </div>
                      </div>

                      <h4 className="font-serif text-xl font-bold text-[#4A1525]">
                        {c.recipientName}
                      </h4>
                      {c.nickname && c.nickname !== c.recipientName && (
                        <p className="text-xs text-[#8C6B73] italic">"{c.nickname}"</p>
                      )}

                      <p className="text-xs text-[#6E4F57] mt-2 line-clamp-2">
                        {c.epistleText || c.openingSubtitle || 'Personalized celebration'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-[#F2EAE5] flex items-center justify-between text-[11px] text-[#8C6B73]">
                        <span>{totalPhotos} photos included</span>
                        <span className="capitalize">♫ {c.soundtrackPreset || 'none'}</span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#F2EAE5]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(c.id)}
                          className="p-2 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] hover:bg-[#F2EAE5] text-[#4A1525] transition-colors cursor-pointer"
                          title="Copy clean delivery link (/c/...)"
                        >
                          {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `❤️ Dear ${c.nickname || c.recipientName}, your personalized celebration moment is ready on Eyan Mi! ✨ Tap to open your envelope:\n${getCelebrationLink(c.id)}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title="Send to celebrant via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => onPreviewCelebration(c.id)}
                          className="p-2 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] hover:bg-[#F2EAE5] text-[#4A1525] transition-colors cursor-pointer"
                          title="Open as Celebrant"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.recipientName)}
                          className="p-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="Delete celebration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onEditCelebration(c)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
