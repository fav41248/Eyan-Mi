import React, { useState } from 'react';
import { CelebrationConfig, EpistleParagraph } from '../types';
import { X, Upload, Check, Copy, Sparkles, Feather, Music, Camera, Film, RefreshCw } from 'lucide-react';

interface EpistleVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CelebrationConfig;
  onSaveConfig: (newConfig: CelebrationConfig) => void;
}

export const EpistleVaultModal: React.FC<EpistleVaultModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'epistle' | 'audio' | 'photos' | 'videos'>('epistle');
  const [rawEpistleText, setRawEpistleText] = useState(
    config.epistleParagraphs.map((p) => p.text).join('\n\n')
  );
  const [syncAvailable, setSyncAvailable] = useState(config.synchronizedTimingAvailable);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleParseAndSaveEpistle = () => {
    // Split by double newline or single newline if spaced
    const rawBlocks = rawEpistleText
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const totalEstDuration = 120; // 2 minutes estimated if timing not strictly supplied
    const timePerBlock = rawBlocks.length > 0 ? totalEstDuration / rawBlocks.length : 20;

    const newParagraphs: EpistleParagraph[] = rawBlocks.map((blockText, index) => {
      const existing = config.epistleParagraphs[index];
      return {
        id: existing?.id || `epistle-part-${index + 1}`,
        note: existing?.note || `Chapter ${index + 1}`,
        text: blockText, // Exact, unaltered text
        startTime: index * timePerBlock,
        endTime: (index + 1) * timePerBlock,
      };
    });

    const updatedConfig: CelebrationConfig = {
      ...config,
      epistleParagraphs: newParagraphs,
      synchronizedTimingAvailable: syncAvailable,
    };

    onSaveConfig(updatedConfig);
    onClose();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Epistle and Media Vault Manager"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#EADBDA] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0DEDB] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#8B1E3F]">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#4A1525]">
                Epistle & Media Vault
              </h2>
              <p className="text-xs text-[#8C6B73]">
                Manage exact text, voice narration, photos, and video memories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8C6B73] hover:bg-[#FAF3F2] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF3F2] rounded-xl mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('epistle')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'epistle'
                ? 'bg-white text-[#8B1E3F] shadow-sm font-semibold'
                : 'text-[#6E4F57] hover:text-[#4A1525]'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Epistle Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-white text-[#8B1E3F] shadow-sm font-semibold'
                : 'text-[#6E4F57] hover:text-[#4A1525]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio & Voice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-white text-[#8B1E3F] shadow-sm font-semibold'
                : 'text-[#6E4F57] hover:text-[#4A1525]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-white text-[#8B1E3F] shadow-sm font-semibold'
                : 'text-[#6E4F57] hover:text-[#4A1525]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          
          {/* TAB 1: EPISTLE TEXT */}
          {activeTab === 'epistle' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF5F4] rounded-xl border border-[#F0D5D8] text-[#6E4F57] leading-relaxed">
                <strong className="text-[#8B1E3F] font-semibold block mb-1">
                  ✨ Authentic Preservation Guarantee:
                </strong>
                Paste your full epistle below. Every paragraph, word, spelling, punctuation mark, and emoji will be preserved exactly without alteration. Separate paragraphs with an empty line.
              </div>

              <div>
                <label className="block font-medium text-[#4A1525] mb-1.5">
                  Your Original Birthday Epistle for Oluwapreciousimi:
                </label>
                <textarea
                  rows={8}
                  value={rawEpistleText}
                  onChange={(e) => setRawEpistleText(e.target.value)}
                  placeholder="Paste your original birthday letter here..."
                  className="w-full p-3.5 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] text-sm text-[#332226] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] font-serif leading-relaxed"
                />
              </div>

              {/* Synchronized timing checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncAvailable}
                  onChange={(e) => setSyncAvailable(e.target.checked)}
                  className="accent-[#8B1E3F] w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-[#4A1525] font-medium">
                  Enable synchronized reading (highlight and scroll paragraphs with voice audio)
                </span>
              </label>
            </div>
          )}

          {/* TAB 2: AUDIO NARRATION */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF5F4] rounded-xl border border-[#F0D5D8] text-[#6E4F57] leading-relaxed">
                <strong className="text-[#8B1E3F] font-semibold block mb-1">
                  🎙️ Voice Recording & Acoustic Player:
                </strong>
                The website includes a built-in acoustic romantic music-box synth. You can also upload your recorded voice note (.mp3, .m4a, .wav) or paste an audio URL.
              </div>

              <div>
                <label className="block font-medium text-[#4A1525] mb-1.5">
                  Audio Recording URL (Optional):
                </label>
                <input
                  type="text"
                  value={config.audioNarrationUrl || ''}
                  onChange={(e) =>
                    onSaveConfig({ ...config, audioNarrationUrl: e.target.value })
                  }
                  placeholder="https://example.com/precious-birthday-voice.mp3"
                  className="w-full px-3 py-2 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] text-xs text-[#332226] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
                />
              </div>

              <div className="p-4 rounded-xl border-2 border-dashed border-[#E5CED2] text-center">
                <Music className="w-8 h-8 text-[#8B1E3F] mx-auto mb-2" />
                <p className="font-medium text-[#4A1525] mb-1">
                  Upload Voice File Directly
                </p>
                <p className="text-[11px] text-[#8C6B73] mb-3">
                  Upload an audio file from your phone or laptop
                </p>
                <input
                  type="file"
                  id="vault-audio-file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const objectUrl = URL.createObjectURL(file);
                      onSaveConfig({ ...config, audioNarrationUrl: objectUrl });
                    }
                  }}
                />
                <label
                  htmlFor="vault-audio-file"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1E3F] text-white font-medium text-xs hover:bg-[#A62B50] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Audio File</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF5F4] rounded-xl border border-[#F0D5D8] text-[#6E4F57] leading-relaxed">
                <strong className="text-[#8B1E3F] font-semibold block mb-1">
                  📸 Authentic Scrapbook Photographs:
                </strong>
                Replace any frame with your actual photos of Precious. Tap each frame to upload an image file.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {config.photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="p-3 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-lg bg-white border border-[#E5CED2] shrink-0 overflow-hidden flex items-center justify-center">
                      {Boolean(photo.url && photo.url.trim()) ? (
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-[#C07D85]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-serif font-bold text-[#4A1525] truncate">
                        Frame #{i + 1}
                      </p>
                      <p className="text-[11px] text-[#8C6B73] truncate">
                        {photo.caption}
                      </p>

                      <label className="inline-block mt-1 text-[11px] text-[#8B1E3F] font-medium hover:underline cursor-pointer">
                        <span>Upload photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const objectUrl = URL.createObjectURL(file);
                              const updatedPhotos = [...config.photos];
                              updatedPhotos[i] = { ...photo, url: objectUrl };
                              onSaveConfig({ ...config, photos: updatedPhotos });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: VIDEOS */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF5F4] rounded-xl border border-[#F0D5D8] text-[#6E4F57] leading-relaxed">
                <strong className="text-[#8B1E3F] font-semibold block mb-1">
                  🎬 Personal Video Memory Clips:
                </strong>
                Upload a video recording of moments with Precious to play smoothly in the video section.
              </div>

              {(config.videos || []).map((vid, i) => (
                <div
                  key={vid.id}
                  className="p-4 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] space-y-2"
                >
                  <p className="font-serif font-bold text-[#4A1525]">
                    {vid.title}
                  </p>
                  <input
                    type="text"
                    value={vid.url}
                    onChange={(e) => {
                      const updated = [...(config.videos || [])];
                      updated[i] = { ...vid, url: e.target.value };
                      onSaveConfig({ ...config, videos: updated });
                    }}
                    placeholder="Video URL or upload below..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EADBDA] bg-white text-xs"
                  />
                  <div>
                    <input
                      type="file"
                      id={`vault-video-${vid.id}`}
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const objectUrl = URL.createObjectURL(file);
                          const updated = [...(config.videos || [])];
                          updated[i] = { ...vid, url: objectUrl };
                          onSaveConfig({ ...config, videos: updated });
                        }
                      }}
                    />
                    <label
                      htmlFor={`vault-video-${vid.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B1E3F] text-white text-xs font-medium cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Video File</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#F0DEDB] pt-4 mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 text-xs text-[#8C6B73] hover:text-[#4A1525] px-3 py-1.5 rounded-lg border border-[#EADBDA] transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'JSON Copied!' : 'Export Config'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#6E4F57] hover:bg-[#FAF3F2] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseAndSaveEpistle}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B1E3F] to-[#A62B50] text-white font-medium text-xs shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
