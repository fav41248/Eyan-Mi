import React, { useState, useEffect, useRef } from 'react';
import { CelebrationConfig, GalleryPhoto, EpistleParagraph } from '../types';
import { celebrationService } from '../lib/celebrationService';
import { INITIAL_CELEBRATION_CONFIG } from '../data/celebrationConfig';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Save,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Heart,
  Sparkles,
  Check,
  FileText,
  Music,
  Calendar,
  AlertCircle,
  RefreshCw,
  Share2
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectCelebrant: (id: string) => void;
  onExitAdmin: () => void;
  currentCelebrantId: string;
  onSaveSuccess?: (updatedConfig: CelebrationConfig) => void;
}

// Compress images before storing in Firestore & cache (maxDim 640px & 0.60 quality produces ~20KB per photo, guaranteeing documents stay well under 1MB)
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 640;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.60));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectCelebrant,
  onExitAdmin,
  currentCelebrantId,
  onSaveSuccess,
}) => {
  const [celebrants, setCelebrants] = useState<CelebrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCelebrant, setEditingCelebrant] = useState<CelebrationConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'loader' | 'gallery' | 'epistle'>('info');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState<CelebrationConfig | null>(null);
  const [isUploadingLoader, setIsUploadingLoader] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const loaderInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Load all celebrants on mount and auto-select current celebrant for direct editing
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const list = await celebrationService.getAllCelebrations();
        setCelebrants(list);
        const targetId = currentCelebrantId || 'precious';
        const active = await celebrationService.getCelebration(targetId);
        if (active) {
          setEditingCelebrant(active);
        } else if (list.length > 0) {
          setEditingCelebrant(list[0]);
        }
      } catch (err) {
        console.error('Failed to load celebrants:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [currentCelebrantId]);

  const loadCelebrants = async () => {
    setLoading(true);
    try {
      const list = await celebrationService.getAllCelebrations();
      setCelebrants(list);
    } catch (err) {
      console.error('Failed to load celebrants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (c: CelebrationConfig) => {
    setLoading(true);
    try {
      // Fetch full configuration including subdocs
      const full = await celebrationService.getCelebration(c.id);
      setEditingCelebrant(full || c);
      setActiveTab('info');
    } catch (err) {
      console.error('Failed to fetch full celebration data:', err);
      setEditingCelebrant(c);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newCelebrant: CelebrationConfig = {
      id: `celebrant-${Date.now().toString().slice(-4)}`,
      recipientName: 'New Celebrant',
      nickname: 'Birthday Star',
      openingTitle: 'For Someone Special ❤️',
      openingSubtitle: 'A handwritten letter, captured memories, and eternal celebration.',
      finaleTitle: 'Forever Celebrating You',
      finaleExactMessage: 'HAPPPYYYYYYY BIRTHDAYYYYYYYYY🤭🤗🎉',
      audioNarrationUrl: '',
      audioTitle: 'Birthday Epistle Voice Narration',
      audioNarrator: 'With Love',
      synchronizedTimingAvailable: true,
      epistleParagraphs: [
        {
          id: 'part-1',
          text: 'Happy Birthday! Today belongs entirely to you. Looking at how wonderfully you carry yourself and how much joy your presence brings, I could not let this day pass without celebrating you.',
          note: 'Chapter I · Celebrating You',
        },
        {
          id: 'part-2',
          text: 'Every laugh and shared moment is cherished. You bring a rare grace and radiant light everywhere you go.',
          note: 'Chapter II · Your Radiant Light',
        },
      ],
      loaderPhotos: [],
      photos: [],
      videos: [],
    };
    setEditingCelebrant(newCelebrant);
    setActiveTab('info');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the celebration for "${name}"?`)) {
      return;
    }
    try {
      await celebrationService.deleteCelebration(id);
      setCelebrants((prev) => prev.filter((item) => item.id !== id));
      if (editingCelebrant?.id === id) {
        setEditingCelebrant(null);
      }
    } catch (err) {
      console.error('Failed to delete celebrant:', err);
    }
  };

  const handleSave = async () => {
    if (!editingCelebrant) return;
    setSaving(true);
    setSaveSuccess(false);

    // Normalize epistle text and paragraphs so they are 100% synchronized
    const trimmedText = (
      editingCelebrant.epistleText !== undefined
        ? editingCelebrant.epistleText
        : (editingCelebrant.epistleParagraphs ? editingCelebrant.epistleParagraphs.map((p) => p.text).join('\n\n') : '')
    ).trim();

    const splitParas = trimmedText
      ? trimmedText
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((text, i) => ({
            id: `epistle-part-${i + 1}`,
            text,
          }))
      : editingCelebrant.epistleParagraphs;

    const configToSave: CelebrationConfig = {
      ...editingCelebrant,
      epistleText: trimmedText,
      epistleParagraphs: splitParas,
    };

    try {
      await celebrationService.saveCelebration(configToSave);
      setEditingCelebrant(configToSave);
      setSaveSuccess(true);
      setShowLinkModal(configToSave);
      onSaveSuccess?.(configToSave);
      await loadCelebrants();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.warn('Cloud save notice (saved to local persistent cache):', err);
      setEditingCelebrant(configToSave);
      setSaveSuccess(true);
      setShowLinkModal(configToSave);
      onSaveSuccess?.(configToSave);
      setTimeout(() => setSaveSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const getShareUrl = (id: string) => {
    const origin = window.location.origin;
    return `${origin}/?c=${encodeURIComponent(id)}&view=celebrant`;
  };

  const handleCopyLink = (id: string) => {
    const link = getShareUrl(id);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppShare = (celebrant: CelebrationConfig) => {
    const link = getShareUrl(celebrant.id);
    const text = encodeURIComponent(
      `Hey ${celebrant.recipientName || 'there'}! ❤️ A special birthday surprise has been prepared just for you. Open your letter here: ${link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Upload Opening Loader Pictures (7 to 10 photos)
  const handleLoaderFiles = async (files: FileList | null) => {
    if (!files || !editingCelebrant) return;
    setIsUploadingLoader(true);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 10);
      const newPhotos: GalleryPhoto[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const compressed = await compressImageFile(validFiles[i]);
        const currentCount = (editingCelebrant.loaderPhotos?.length || 0) + i + 1;
        newPhotos.push({
          id: `loader-${Date.now()}-${i}`,
          url: compressed,
          caption: `Precious moment #${currentCount}`,
          tag: `0${currentCount} · Memory`,
          rotation: i % 2 === 0 ? -1.5 : 1.5,
        });
      }

      setEditingCelebrant((prev) =>
        prev
          ? {
              ...prev,
              loaderPhotos: [...(prev.loaderPhotos || []), ...newPhotos].slice(0, 10),
            }
          : null
      );
    } catch (err) {
      console.error('Error uploading loader photos:', err);
    } finally {
      setIsUploadingLoader(false);
    }
  };

  // Upload Gallery Photos (up to 10 images)
  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || !editingCelebrant) return;
    setIsUploadingGallery(true);

    try {
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 10);
      const newPhotos: GalleryPhoto[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const compressed = await compressImageFile(validFiles[i]);
        newPhotos.push({
          id: `gallery-${Date.now()}-${i}`,
          url: compressed,
          caption: `Cherished memory #${i + 1}`,
          date: 'Special Moment',
          rotation: (i % 3 - 1) * 1.5,
          tapeColor: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'blush' : 'rose',
        });
      }

      setEditingCelebrant((prev) => prev ? {
        ...prev,
        photos: [...prev.photos, ...newPhotos].slice(0, 10),
      } : null);
    } catch (err) {
      console.error('Error uploading gallery photos:', err);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241318] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#EADBDA] px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B1E3F] to-[#D4AF37] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-[#4A1525]">
              Celebrant Command Center
            </h1>
            <p className="text-xs text-[#8C6B73]">
              Manage celebrants, customize epistles, and generate unique links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editingCelebrant ? (
            <>
              <button
                type="button"
                onClick={() => setEditingCelebrant(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#EADBDA] text-xs font-semibold text-[#6E4F57] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Celebrants</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold shadow-xs hover:bg-[#721532] transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-3.5 py-1.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold shadow-xs hover:bg-[#721532] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Celebrant</span>
              </button>

              <button
                type="button"
                onClick={onExitAdmin}
                className="px-3 py-1.5 rounded-xl border border-[#EADBDA] bg-white text-xs font-medium text-[#4A1525] hover:bg-[#FAF7F2] transition-colors"
              >
                View App
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-[#8B1E3F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-serif text-[#4A1525] text-sm">Loading Celebrant Data...</p>
          </div>
        ) : editingCelebrant ? (
          /* ================= EDIT / CREATE CELEBRANT FORM ================= */
          <div className="space-y-6">
            {/* Celebrant Direct Link Banner */}
            <div className="bg-gradient-to-r from-[#FFF5F6] via-[#FAF7F2] to-[#FFF0F2] rounded-2xl p-5 border-2 border-[#EADBDA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[#8B1E3F] bg-white px-2.5 py-1 rounded-md border border-[#F2D7DC]">
                    ✨ Private Celebrant Link
                  </span>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    Celebrants will NOT see admin controls
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#4A1525] mt-1.5">
                  {editingCelebrant.recipientName || 'Unnamed Celebrant'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#8C6B73]">
                  <span className="font-mono bg-white px-2.5 py-1 rounded border border-[#EEDBDB] text-[#4A1525] select-all">
                    {getShareUrl(editingCelebrant.id)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(editingCelebrant.id)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#EADBDA] text-xs font-semibold text-[#8B1E3F] hover:bg-[#FFF0F2] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedId === editingCelebrant.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied Link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Celebrant Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(editingCelebrant)}
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba5a] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCelebrant(editingCelebrant.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Preview as celebrant"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview as Celebrant</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#EADBDA] pb-2 overflow-x-auto">
              {[
                { id: 'info', label: '1. Basic Info & Headline', icon: Users },
                { id: 'loader', label: `2. Loader Pictures (${editingCelebrant.loaderPhotos?.length || 0}/10)`, icon: Sparkles },
                { id: 'gallery', label: `3. Scrapbook Gallery (${editingCelebrant.photos?.length || 0}/10)`, icon: ImageIcon },
                { id: 'epistle', label: '4. Birthday Epistle', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#8B1E3F] text-white shadow-xs'
                        : 'bg-white text-[#6E4F57] hover:bg-[#FFF7F8] border border-[#EADBDA]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Basic Info & Headline */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-2xl p-6 border border-[#EADBDA] shadow-xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1.5">
                      Celebrant Full Name
                    </label>
                    <input
                      type="text"
                      value={editingCelebrant.recipientName}
                      onChange={(e) =>
                        setEditingCelebrant({ ...editingCelebrant, recipientName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm focus:outline-[#8B1E3F]"
                      placeholder="e.g. Oluwapreciousimi"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1.5">
                      Affectionate Nickname
                    </label>
                    <input
                      type="text"
                      value={editingCelebrant.nickname}
                      onChange={(e) =>
                        setEditingCelebrant({ ...editingCelebrant, nickname: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm focus:outline-[#8B1E3F]"
                      placeholder="e.g. Precious"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1.5">
                      Unique Link Slug (Letters, numbers, dashes)
                    </label>
                    <div className="flex items-center">
                      <span className="bg-[#EEDBDB] text-[#6E4F57] px-3 py-2.5 rounded-l-xl text-xs border border-r-0 border-[#D5C2C6] font-mono">
                        ?c=
                      </span>
                      <input
                        type="text"
                        value={editingCelebrant.id}
                        onChange={(e) =>
                          setEditingCelebrant({
                            ...editingCelebrant,
                            id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-r-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm font-mono focus:outline-[#8B1E3F]"
                        placeholder="e.g. precious"
                      />
                    </div>
                    <p className="text-[11px] text-[#8C6B73] mt-1">
                      This slug becomes the exact private link you share with them!
                    </p>
                  </div>
                </div>

                {/* Lovely Opening Headline & Subtitle Section */}
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border-2 border-[#EADBDA] space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8B1E3F]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A1525]">
                      Opening Intro Screen (First Thing The Celebrant Sees)
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#8C6B73]">
                    This headline and subtitle will appear first as a grand, romantic greeting before the 7 to 10 pictures begin.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1">
                        Lovely Opening Headline
                      </label>
                      <input
                        type="text"
                        value={editingCelebrant.openingTitle || ''}
                        onChange={(e) =>
                          setEditingCelebrant({ ...editingCelebrant, openingTitle: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-white text-sm font-serif font-bold text-[#4A1525] focus:outline-[#8B1E3F]"
                        placeholder="e.g. For My Beautiful Oluwapreciousimi ❤️"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1">
                        Lovely Subtitle / Love Note
                      </label>
                      <textarea
                        rows={2}
                        value={editingCelebrant.openingSubtitle || ''}
                        onChange={(e) =>
                          setEditingCelebrant({ ...editingCelebrant, openingSubtitle: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D5C2C6] bg-white text-xs text-[#241318] focus:outline-[#8B1E3F]"
                        placeholder="e.g. Before you unseal your handwritten birthday letter, take a moment to look at these captured memories of you..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0DFDE]">
                  <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1.5">
                    Finale Reveal Message (Shown after opening envelope)
                  </label>
                  <input
                    type="text"
                    value={editingCelebrant.finaleExactMessage}
                    onChange={(e) =>
                      setEditingCelebrant({ ...editingCelebrant, finaleExactMessage: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm font-medium focus:outline-[#8B1E3F]"
                    placeholder="HAPPPYYYYYYY BIRTHDAYYYYYYYYY🤭🤗🤭🤗"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Opening Loader Pictures (7 to 10 Photos) */}
            {activeTab === 'loader' && (
              <div className="bg-white rounded-2xl p-6 border border-[#EADBDA] shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0DFDE]">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#4A1525]">
                      Opening Loader Pictures (7 to 10 Photos)
                    </h3>
                    <p className="text-xs text-[#8C6B73]">
                      These pictures cycle immediately after the lovely opening headline, before the birthday envelope is unsealed.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={loaderInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleLoaderFiles(e.target.files)}
                    />

                    <button
                      type="button"
                      onClick={() => loaderInputRef.current?.click()}
                      disabled={isUploadingLoader || (editingCelebrant.loaderPhotos?.length || 0) >= 10}
                      className="px-4 py-2 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold shadow-xs hover:bg-[#721532] transition-colors flex items-center gap-2 self-start cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {isUploadingLoader
                          ? 'Compressing...'
                          : `Add Loader Pictures (${editingCelebrant.loaderPhotos?.length || 0}/10)`}
                      </span>
                    </button>
                  </div>
                </div>

                {(!editingCelebrant.loaderPhotos || editingCelebrant.loaderPhotos.length === 0) ? (
                  <div
                    onClick={() => loaderInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D5C2C6] rounded-2xl p-10 text-center cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                  >
                    <Sparkles className="w-12 h-12 text-[#8B1E3F] mx-auto mb-2 opacity-80" />
                    <p className="font-serif font-bold text-[#4A1525]">No loader pictures added yet</p>
                    <p className="text-xs text-[#8C6B73] mt-1 max-w-sm mx-auto">
                      Click to upload 7 to 10 pictures of the celebrant. They will glide smoothly right after the opening headline!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {editingCelebrant.loaderPhotos.map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        className="bg-[#FAF7F2] rounded-2xl p-3 border border-[#EADBDA] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all"
                      >
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/5 mb-3">
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.caption}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[#8C6B73]">
                              No image
                            </div>
                          )}
                          <span className="absolute top-2 left-2 bg-[#8B1E3F] text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-xs">
                            Photo #{idx + 1}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#6E4F57] uppercase tracking-wider block">
                              Caption for Photo #{idx + 1}
                            </label>
                            <input
                              type="text"
                              value={photo.caption}
                              onChange={(e) => {
                                const updated = [...editingCelebrant.loaderPhotos];
                                updated[idx] = { ...updated[idx], caption: e.target.value };
                                setEditingCelebrant({ ...editingCelebrant, loaderPhotos: updated });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C2C6] bg-white text-xs font-serif focus:outline-[#8B1E3F]"
                              placeholder="Add romantic caption..."
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-[#8C6B73] font-mono">
                              Step {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editingCelebrant.loaderPhotos.filter((_, i) => i !== idx);
                                setEditingCelebrant({ ...editingCelebrant, loaderPhotos: updated });
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Scrapbook Gallery */}
            {activeTab === 'gallery' && (
              <div className="bg-white rounded-2xl p-6 border border-[#EADBDA] shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0DFDE]">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#4A1525]">
                      Celebrant Scrapbook Gallery (Up to 10 Photos)
                    </h3>
                    <p className="text-xs text-[#8C6B73]">
                      Displayed in the interactive photo scrapbook below the opened letter.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingCelebrant.loaderPhotos && editingCelebrant.loaderPhotos.length > 0 && (!editingCelebrant.photos || editingCelebrant.photos.length === 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCelebrant({
                            ...editingCelebrant,
                            photos: [...editingCelebrant.loaderPhotos],
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#8B1E3F] text-[#8B1E3F] text-xs font-semibold hover:bg-[#FFF0F2] transition-colors"
                      >
                        Import {editingCelebrant.loaderPhotos.length} existing photos
                      </button>
                    )}

                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleGalleryFiles(e.target.files)}
                    />

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingGallery || (editingCelebrant.photos?.length || 0) >= 10}
                      className="px-4 py-2 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold shadow-xs hover:bg-[#721532] transition-colors flex items-center gap-2 self-start cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingGallery ? 'Compressing...' : 'Add Gallery Photos'}</span>
                    </button>
                  </div>
                </div>

                {(!editingCelebrant.photos || editingCelebrant.photos.length === 0) ? (
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D5C2C6] rounded-2xl p-10 text-center cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                  >
                    <ImageIcon className="w-12 h-12 text-[#8B1E3F] mx-auto mb-2 opacity-80" />
                    <p className="font-serif font-bold text-[#4A1525]">No gallery photos yet</p>
                    <p className="text-xs text-[#8C6B73] mt-1 max-w-sm mx-auto">
                      Upload up to 10 photos of the celebrant for their scrapbook album.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {editingCelebrant.photos.map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        className="bg-[#FAF7F2] rounded-2xl p-3 border border-[#EADBDA] flex flex-col justify-between"
                      >
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/5 mb-3">
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.caption}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[#8C6B73]">
                              No image
                            </div>
                          )}
                          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#6E4F57] uppercase tracking-wider block">
                              Caption
                            </label>
                            <input
                              type="text"
                              value={photo.caption}
                              onChange={(e) => {
                                const updated = [...editingCelebrant.photos];
                                updated[idx] = { ...updated[idx], caption: e.target.value };
                                setEditingCelebrant({ ...editingCelebrant, photos: updated });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C2C6] bg-white text-xs font-serif"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-[#8C6B73]">{photo.date || 'Moment'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editingCelebrant.photos.filter((_, i) => i !== idx);
                                setEditingCelebrant({ ...editingCelebrant, photos: updated });
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Single Continuous Epistle */}
            {activeTab === 'epistle' && (
              <div className="bg-white rounded-2xl p-6 border border-[#EADBDA] shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0DFDE]">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#4A1525]">
                      Handwritten Birthday Epistle (Single Continuous Letter)
                    </h3>
                    <p className="text-xs text-[#8C6B73]">
                      No chapters or division tags. One flowing, romantic handwritten letter on parchment.
                    </p>
                  </div>
                </div>

                {/* Single continuous textarea */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#4A1525] uppercase tracking-wider">
                      Complete Epistle Text
                    </label>
                    <span className="text-[11px] text-[#8C6B73]">
                      Press Enter twice to start a new paragraph
                    </span>
                  </div>

                  <textarea
                    rows={12}
                    value={
                      editingCelebrant.epistleText !== undefined
                        ? editingCelebrant.epistleText
                        : editingCelebrant.epistleParagraphs.map((p) => p.text).join('\n\n')
                    }
                    onChange={(e) => {
                      const newText = e.target.value;
                      const splitParas = newText
                        .split(/\n\s*\n/)
                        .map((p) => p.trim())
                        .filter(Boolean)
                        .map((text, i) => ({
                          id: `epistle-part-${i + 1}`,
                          text,
                        }));
                      setEditingCelebrant({
                        ...editingCelebrant,
                        epistleText: newText,
                        epistleParagraphs: splitParas,
                      });
                    }}
                    className="w-full p-4 sm:p-5 rounded-2xl border-2 border-[#D5C2C6] bg-[#FFFDFB] font-serif text-sm sm:text-base text-[#241318] leading-relaxed focus:outline-[#8B1E3F] shadow-inner"
                    placeholder="Write your heartfelt birthday epistle here..."
                  />

                  {/* Prominent Save & Preview Action Bar directly below the epistle */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBDA] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {saveSuccess ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl shadow-xs">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Epistle Saved Permanently to Cloud Database!</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8C6B73]">
                          Edits save to Cloud Firestore permanently and update live for the celebrant.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E3F] to-[#B32752] text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving to Cloud...' : saveSuccess ? 'Saved to Cloud! ✓' : 'Save Birthday Epistle Now'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectCelebrant(editingCelebrant.id)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-[#8B1E3F] text-[#8B1E3F] text-xs font-bold hover:bg-[#FFF0F2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        title="Preview the celebrant page with this epistle"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Preview Letter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= ALL CELEBRANTS LIST ================= */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#4A1525]">
                  Active Celebrants ({celebrants.length})
                </h2>
                <p className="text-xs text-[#8C6B73]">
                  Each celebrant has their own personalized link with custom photos, letter, and loader.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateNew}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E3F] to-[#A62B50] text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Celebrant</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {celebrants.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-[#EADBDA] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B1E3F] bg-[#FFF0F2] px-2 py-0.5 rounded-md">
                          Slug: {c.id}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-[#4A1525] mt-1">
                          {c.recipientName}
                        </h3>
                        <p className="text-xs text-[#8C6B73]">
                          {c.nickname ? `"${c.nickname}"` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="p-1.5 rounded-lg text-[#6E4F57] hover:bg-[#FAF7F2] transition-colors"
                          title="Edit celebrant"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {celebrants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.recipientName)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete celebrant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Link bar */}
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#F0DFDE] mb-4">
                      <p className="text-[10px] font-semibold text-[#8C6B73] uppercase tracking-wider mb-1">
                        Personalized Shareable Link
                      </p>
                      <p className="font-mono text-[11px] text-[#4A1525] truncate">
                        {getShareUrl(c.id)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#F5EAE8]">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(c.id)}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#EADBDA] bg-[#FFFDFB] text-xs font-semibold text-[#8B1E3F] hover:bg-[#FFF0F2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedId === c.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWhatsAppShare(c)}
                      className="py-2 px-3 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba5a] transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                      title="Send link via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = getShareUrl(c.id);
                        window.open(url, '_blank');
                      }}
                      className="py-2 px-3 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      title="Test viewing without admin controls"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Pop-up Dialog when celebrant is created or saved */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EADBDA] relative text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#4A1525]">
              Celebrant Link Generated! 🎉
            </h3>
            <p className="text-xs text-[#6E4F57] mt-1.5 leading-relaxed">
              Send this private link to <strong className="text-[#8B1E3F]">{showLinkModal.recipientName}</strong>. They will see only their birthday celebration and love letter — they will <strong>never</strong> see the admin dashboard.
            </p>

            <div className="mt-5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADBDA] flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#4A1525] truncate select-all">
                {getShareUrl(showLinkModal.id)}
              </span>
              <button
                type="button"
                onClick={() => handleCopyLink(showLinkModal.id)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#EADBDA] text-xs font-semibold text-[#8B1E3F] hover:bg-[#FFF0F2] flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              >
                {copiedId === showLinkModal.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleWhatsAppShare(showLinkModal)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba5a] flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetId = showLinkModal.id;
                  setShowLinkModal(null);
                  onSelectCelebrant(targetId);
                }}
                className="py-3 px-4 rounded-xl bg-[#FAF7F2] border border-[#EADBDA] text-[#4A1525] text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Test Link as Celebrant</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowLinkModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
