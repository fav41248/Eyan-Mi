import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { celebrationService } from '../lib/celebrationService';
import {
  CelebrationConfig,
  GalleryPhoto,
  LetterType,
  SoundtrackPreset,
  OccasionType,
} from '../types';
import { soundtrackEngine } from '../utils/audioEngine';
import {
  Heart,
  Sparkles,
  Mic,
  FileText,
  Music,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  ArrowRight,
  Upload,
  Play,
  Square,
  Trash2,
  Copy,
  ExternalLink,
  Volume2,
  VolumeX,
  Wand2,
  Save,
  RotateCcw,
  Share2,
  Link2,
  Globe,
  MessageCircle,
  QrCode,
  CheckCheck,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface CelebrationStudioProps {
  initialConfig?: CelebrationConfig | null;
  onExit: () => void;
  onSaved: (savedConfig: CelebrationConfig) => void;
  onPreviewCelebrant?: (draftConfig: CelebrationConfig) => void;
}

// Compress images before saving
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

export const CelebrationStudio: React.FC<CelebrationStudioProps> = ({
  initialConfig,
  onExit,
  onSaved,
  onPreviewCelebrant,
}) => {
  const { user, userProfile } = useAuth();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delivery Link State
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<'clean' | 'query' | 'short' | 'message' | null>(null);

  // Form State
  const [id, setId] = useState(() => initialConfig?.id || `eyan-${Date.now().toString().slice(-5)}`);
  const [recipientName, setRecipientName] = useState(() => initialConfig?.recipientName || '');
  const [nickname, setNickname] = useState(() => initialConfig?.nickname || '');
  const [occasion, setOccasion] = useState<OccasionType>(
    (initialConfig?.occasion as OccasionType) || 'birthday'
  );
  const [openingTitle, setOpeningTitle] = useState(
    () => initialConfig?.openingTitle || 'Celebrating You Today ❤️'
  );
  const [openingSubtitle, setOpeningSubtitle] = useState(
    () =>
      initialConfig?.openingSubtitle ||
      'A personal letter, captured memories, and love written straight from the heart.'
  );
  const [finaleExactMessage, setFinaleExactMessage] = useState(
    () => initialConfig?.finaleExactMessage || 'HAPPY BIRTHDAY MY PERSON! 🥂✨'
  );

  // Step 2: Letter & Voice
  const [letterType, setLetterType] = useState<LetterType>(
    initialConfig?.letterType || (initialConfig?.voiceAudioUrl ? 'both' : 'typed')
  );
  const [epistleText, setEpistleText] = useState(() => initialConfig?.epistleText || '');
  const [voiceAudioUrl, setVoiceAudioUrl] = useState(() => initialConfig?.voiceAudioUrl || '');
  const [voiceDuration, setVoiceDuration] = useState<number>(() => initialConfig?.voiceDuration || 0);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Eyan Mi AI Epistle Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRelationship, setAiRelationship] = useState('Best Friend');
  const [aiMemories, setAiMemories] = useState('');
  const [aiTone, setAiTone] = useState('deeply-emotional');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState('');
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  // Step 3: Sound & Music
  const [soundtrackPreset, setSoundtrackPreset] = useState<SoundtrackPreset>(
    initialConfig?.soundtrackPreset || 'none'
  );
  const [customAudioUrl, setCustomAudioUrl] = useState(
    () => initialConfig?.customAudioUrl || ''
  );
  const [playingPreview, setPlayingPreview] = useState<SoundtrackPreset | null>(null);

  // Step 4: Photos
  const [loaderPhotos, setLoaderPhotos] = useState<GalleryPhoto[]>(
    () => initialConfig?.loaderPhotos || []
  );
  const [photos, setPhotos] = useState<GalleryPhoto[]>(
    () => initialConfig?.photos || []
  );
  const [uploadingLoader, setUploadingLoader] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const loaderInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      soundtrackEngine.stop();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  // Sync title when name changes
  useEffect(() => {
    if (recipientName && !initialConfig) {
      setOpeningTitle(`For ${recipientName.trim()} ❤️`);
      setFinaleExactMessage(`HAPPY ${occasion.toUpperCase()} ${recipientName.trim()}! 🥂✨`);
    }
  }, [recipientName, occasion]);

  // Voice recording handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          setVoiceDuration(prev + 1);
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      alert('Microphone access is required to record your voice. Please allow microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  const handleRecipientNameChange = (name: string) => {
    setRecipientName(name);
    if (!slugManuallyEdited) {
      const autoSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24);
      if (autoSlug) {
        setId(autoSlug);
      }
    }
  };

  // Eyan Mi AI Epistle Generation
  const handleGenerateAI = async (customParams?: {
    name?: string;
    nick?: string;
    rel?: string;
    occ?: OccasionType;
    memories?: string;
    tone?: string;
  }): Promise<string | null> => {
    const targetName = (customParams?.name ?? recipientName).trim() || 'My Cherished Person';
    const targetNick = (customParams?.nick ?? nickname).trim() || targetName;
    const targetRel = customParams?.rel ?? aiRelationship;
    const targetOcc = customParams?.occ ?? occasion;
    const targetMemories = customParams?.memories ?? aiMemories;
    const targetTone = customParams?.tone ?? aiTone;

    if (!recipientName.trim()) {
      handleRecipientNameChange(targetName);
    }

    setIsGeneratingAI(true);
    setAiStatusMessage('Listening to your sentiments & memories...');

    const timer1 = setTimeout(() => {
      setAiStatusMessage('Eyan Mi AI Epistle is weaving heartfelt stanzas...');
    }, 1000);

    const timer2 = setTimeout(() => {
      setAiStatusMessage('Infusing emotional tone and poetic blessing...');
    }, 2200);

    try {
      const generated = await celebrationService.generateAIEpistle({
        recipientName: targetName,
        nickname: targetNick,
        relationship: targetRel,
        occasion: targetOcc,
        memoriesAndTraits: targetMemories,
        tone: targetTone,
      });
      clearTimeout(timer1);
      clearTimeout(timer2);
      setAiGeneratedPreview(generated);
      setAiStatusMessage('✨ Your Eyan Mi AI Epistle is ready!');
      return generated;
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.warn('AI fallback notice:', err);
      return null;
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleQuickGenerateEpistle = async () => {
    const generated = await handleGenerateAI();
    if (generated) {
      setEpistleText(generated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleApplyAIEpistle = () => {
    if (aiGeneratedPreview) {
      setEpistleText(aiGeneratedPreview);
      setShowAIModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Delivery link calculations
  const effectiveDomain = window.location.origin.replace(/\/$/, '');
  const cleanShareLink = `${effectiveDomain}/c/${id}`;
  const queryShareLink = `${effectiveDomain}/?c=${id}`;
  const activeShareLink = shortUrl || cleanShareLink;

  const handleShortenLink = async () => {
    setIsShortening(true);
    try {
      const shortened = await celebrationService.shortenCelebrantLink(cleanShareLink);
      if (shortened && shortened.startsWith('http')) {
        setShortUrl(shortened);
      }
    } catch (e) {
      console.warn('Shortening error:', e);
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopyFormattedLink = (format: 'clean' | 'query' | 'short' | 'message', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Live Test View as Celebrant: Previews the EXACT birthday letter being created
  const handleTestViewAsCelebrant = () => {
    const rawParagraphs = epistleText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const formattedParagraphs =
      rawParagraphs.length > 0
        ? rawParagraphs.map((text, i) => ({
            id: `para-${i + 1}`,
            text,
          }))
        : [
            {
              id: 'para-1',
              text:
                epistleText.trim() ||
                `My dearest ${nickname || recipientName || 'celebrant'}, today belongs entirely to you...`,
            },
          ];

    const draftConfig: CelebrationConfig = {
      id: id.trim() || `eyan-${Date.now().toString().slice(-5)}`,
      recipientName: recipientName.trim() || 'My Celebrant',
      nickname: nickname.trim() || recipientName.trim() || 'Celebrant',
      occasion: occasion || 'birthday',
      openingTitle: openingTitle.trim() || `For ${recipientName || 'You'} ❤️`,
      openingSubtitle:
        openingSubtitle.trim() ||
        'A handwritten letter, captured moments, and a love that words can only begin to describe.',
      finaleTitle: 'Forever Celebrating You',
      finaleExactMessage: finaleExactMessage.trim() || `HAPPY ${occasion.toUpperCase()}! 🥂✨`,
      epistleText:
        epistleText.trim() ||
        `My dearest ${nickname || recipientName || 'celebrant'}, today belongs entirely to you...`,
      epistleParagraphs: formattedParagraphs,
      letterType,
      voiceAudioUrl,
      voiceDuration,
      soundtrackPreset,
      customAudioUrl,
      loaderPhotos,
      photos,
      videos: initialConfig?.videos || [],
      viewsCount: initialConfig?.viewsCount || 0,
      createdAt: initialConfig?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cache locally so it is immediately loaded without generic fallback
    try {
      localStorage.setItem(`celebration_${draftConfig.id.toLowerCase()}`, JSON.stringify(draftConfig));
      sessionStorage.setItem('eyanmi_preview_draft', JSON.stringify(draftConfig));
    } catch {}

    // Save in background to server / Firestore
    celebrationService.saveCelebration(draftConfig).catch((err) => {
      console.warn('Draft auto-save notice:', err);
    });

    if (onPreviewCelebrant) {
      onPreviewCelebrant(draftConfig);
    } else {
      window.location.href = `/?c=${encodeURIComponent(draftConfig.id)}&preview=true`;
    }
  };

  // Sound Preview
  const handleToggleSoundPreview = (preset: SoundtrackPreset) => {
    if (playingPreview === preset) {
      soundtrackEngine.stop();
      setPlayingPreview(null);
    } else {
      soundtrackEngine.stop();
      soundtrackEngine.start(preset, customAudioUrl);
      setPlayingPreview(preset);
    }
  };

  // Image Uploads
  const handleLoaderUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploadingLoader(true);
    try {
      const fileArr = Array.from(files).slice(0, 8);
      const newItems: GalleryPhoto[] = [];
      for (let i = 0; i < fileArr.length; i++) {
        const compressed = await compressImageFile(fileArr[i]);
        newItems.push({
          id: `loader-${Date.now()}-${i}`,
          url: compressed,
          caption: `${recipientName || 'Moments'} #${loaderPhotos.length + i + 1}`,
          tag: `0${loaderPhotos.length + i + 1} · Pure Glow`,
          rotation: (i % 2 === 0 ? -1 : 1) * 1.5,
        });
      }
      setLoaderPhotos((prev) => [...prev, ...newItems].slice(0, 8));
    } finally {
      setUploadingLoader(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploadingGallery(true);
    try {
      const fileArr = Array.from(files).slice(0, 10);
      const newItems: GalleryPhoto[] = [];
      for (let i = 0; i < fileArr.length; i++) {
        const compressed = await compressImageFile(fileArr[i]);
        newItems.push({
          id: `photo-${Date.now()}-${i}`,
          url: compressed,
          caption: `Cherished memory #${photos.length + i + 1}`,
          date: 'Special Moment',
          rotation: (i % 3 - 1) * 2,
          tapeColor: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'blush' : 'rose',
        });
      }
      setPhotos((prev) => [...prev, ...newItems].slice(0, 10));
    } finally {
      setUploadingGallery(false);
    }
  };

  // Save Celebration
  const handleSave = async () => {
    if (!recipientName.trim()) {
      alert('Please enter your person’s name.');
      setActiveStep(1);
      return;
    }

    setSaving(true);
    try {
      soundtrackEngine.stop();

      const paragraphs = epistleText
        ? epistleText
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((text, i) => ({
              id: `part-${i + 1}`,
              text,
            }))
        : [];

      const cleanId = (id || recipientName)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `celebrant-${Date.now().toString().slice(-4)}`;

      const payload: CelebrationConfig = {
        id: cleanId,
        userId: user?.uid || userProfile?.uid || 'anonymous',
        userEmail: user?.email || userProfile?.email || '',
        recipientName: recipientName.trim(),
        nickname: nickname.trim() || recipientName.trim(),
        occasion,
        letterType,
        openingTitle,
        openingSubtitle,
        finaleTitle: 'Forever Celebrating You',
        finaleExactMessage,
        epistleText,
        epistleParagraphs: paragraphs,
        voiceAudioUrl,
        voiceDuration,
        soundtrackPreset,
        customAudioUrl,
        loaderPhotos,
        photos,
        updatedAt: new Date().toISOString(),
        createdAt: initialConfig?.createdAt || new Date().toISOString(),
      };

      await celebrationService.saveCelebration(payload);
      setSaveSuccess(true);
      onSaved(payload);
      setActiveStep(5);
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Please check your connection'}`);
    } finally {
      setSaving(false);
    }
  };

  const shareLink = cleanShareLink;

  const copyShareLink = () => {
    navigator.clipboard.writeText(activeShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241318] flex flex-col font-sans">
      {/* Studio Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#EADBDA] px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-xl text-[#6E4F57] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-[#4A1525]">
                Eyan mi · Celebration Studio
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF0F2] text-[#8B1E3F] font-semibold border border-[#F5CDD3]">
                {recipientName ? `For ${recipientName}` : 'New Creation'}
              </span>
            </div>
            <p className="text-[11px] text-[#8C6B73]">
              Short delivery link: <code className="font-mono text-[#8B1E3F]">/c/{id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestViewAsCelebrant}
            className="px-3.5 py-2 rounded-xl border border-[#8B1E3F] bg-white hover:bg-[#FFF0F2] text-[#8B1E3F] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Preview the exact birthday letter you are working on"
          >
            <Eye className="w-3.5 h-3.5 text-[#8B1E3F]" />
            <span className="hidden sm:inline">Test View as Celebrant</span>
            <span className="sm:hidden">Preview</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </header>

      {/* Stepper Navigation */}
      <div className="bg-white border-b border-[#EADBDA] px-4 sm:px-8 py-3 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 min-w-[540px]">
          {[
            { num: 1, label: '1. The Person' },
            { num: 2, label: '2. The Letter & Voice' },
            { num: 3, label: '3. Sound (Optional)' },
            { num: 4, label: '4. Photo Moments' },
            { num: 5, label: '5. Review & Share' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStep === s.num
                  ? 'bg-[#8B1E3F] text-white shadow-xs'
                  : 'text-[#6E4F57] hover:bg-[#FAF7F2]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === s.num ? 'bg-white/20 text-white' : 'bg-[#EADBDA] text-[#4A1525]'
                }`}
              >
                {s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
        {/* STEP 1: THE PERSON & OCCASION */}
        {activeStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADBDA] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
                Step 1 of 5
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#4A1525] mt-1">
                Who is your person?
              </h2>
              <p className="text-xs text-[#8C6B73]">
                Enter their details and choose the celebratory milestone.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1.5">
                  Full Name of Celebrant *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => handleRecipientNameChange(e.target.value)}
                  placeholder="e.g. Oluwapreciousimi, Sarah, Michael"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm focus:outline-[#8B1E3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1.5">
                  Affectionate Nickname / Pet Name
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Precious, My Heart, Sunshine"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm focus:outline-[#8B1E3F]"
                />
              </div>
            </div>

            {/* Occasion Selector */}
            <div>
              <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-2">
                What is the occasion?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: 'birthday', label: '🎂 Birthday' },
                  { id: 'anniversary', label: '💍 Anniversary' },
                  { id: 'appreciation', label: '💐 Appreciation' },
                  { id: 'love', label: '❤️ Pure Love' },
                  { id: 'just-because', label: '✨ Just Because' },
                ].map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccasion(occ.id as OccasionType)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      occasion === occ.id
                        ? 'bg-[#8B1E3F] border-[#8B1E3F] text-white shadow-xs'
                        : 'bg-[#FAF7F2] border-[#EADBDA] text-[#6E4F57] hover:bg-[#F2EAE5]'
                    }`}
                  >
                    {occ.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F0DFDE]">
              <div>
                <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider mb-1.5">
                  Opening Headline
                </label>
                <input
                  type="text"
                  value={openingTitle}
                  onChange={(e) => setOpeningTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm focus:outline-[#8B1E3F]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider">
                    Custom Link Slug
                  </label>
                  <span className="text-[11px] text-[#8C6B73]">
                    Delivery: <strong className="text-[#8B1E3F]">/c/{id || 'slug'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#8B1E3F] px-2.5 py-2 rounded-xl bg-[#FFF0F2] border border-[#F5CDD3]">
                    /c/
                  </span>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                    }}
                    placeholder="e.g. oluwa, precious"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-sm font-mono text-[#8B1E3F] focus:outline-[#8B1E3F]"
                  />
                </div>
                <p className="text-[11px] text-[#8C6B73] mt-1">
                  Keep it short (e.g. <code className="text-[#8B1E3F] font-bold">oluwa</code>) for a clean celebrant link!
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-6 py-2.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue to Letter & Voice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: THE LETTER & VOICE RECORDING */}
        {activeStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADBDA] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
                Step 2 of 5
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#4A1525] mt-1">
                The Letter & Voice Recording
              </h2>
              <p className="text-xs text-[#8C6B73]">
                Pick your delivery format: written letter, your real voice reading it, or both!
              </p>
            </div>

            {/* Letter Format Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'typed',
                  title: 'Typed Letter Only',
                  desc: 'Handwritten parchment letter they read quietly',
                  icon: FileText,
                },
                {
                  id: 'voice',
                  title: 'Voice Recording Only',
                  desc: 'Audio player with your voice reading a spoken letter',
                  icon: Mic,
                },
                {
                  id: 'both',
                  title: 'Combination of Both',
                  desc: 'Parchment letter that they read along while your voice plays',
                  icon: Sparkles,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = letterType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLetterType(opt.id as LetterType)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF5F6] border-[#8B1E3F] shadow-xs'
                        : 'bg-[#FAF7F2] border-[#EADBDA] hover:bg-[#F2EAE5]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                        isSelected ? 'bg-[#8B1E3F] text-white' : 'bg-white text-[#6E4F57] border border-[#EADBDA]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-[#4A1525]">{opt.title}</div>
                    <p className="text-[11px] text-[#8C6B73] mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* TYPED LETTER EDITOR (For 'typed' or 'both') */}
            {(letterType === 'typed' || letterType === 'both') && (
              <div className="space-y-3 pt-3 border-t border-[#F0DFDE]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-[#4A1525] uppercase tracking-wider">
                    Handwritten Epistle Text
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickGenerateEpistle}
                      disabled={isGeneratingAI}
                      className="px-3 py-1.5 rounded-xl border border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#FFF0F2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Generate a personalized letter with 1-click directly into this box"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAI ? 'Writing Epistle...' : '⚡ 1-Click Fast Epistle'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAIModal(true);
                        setAiGeneratedPreview('');
                        setAiStatusMessage('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8B1E3F] via-[#A82A4D] to-[#D4AF37] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Eyan Mi AI Epistle</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={epistleText}
                  onChange={(e) => setEpistleText(e.target.value)}
                  placeholder="My dearest person, looking at how wonderful you are..."
                  className="w-full p-4 rounded-2xl border border-[#D5C2C6] bg-[#FAF7F2] font-serif text-sm sm:text-base leading-relaxed text-[#241318] focus:outline-[#8B1E3F]"
                />
                <p className="text-[11px] text-[#8C6B73]">
                  Separate paragraphs with double Enter. Character count: {epistleText.length}
                </p>
              </div>
            )}

            {/* VOICE RECORDER (For 'voice' or 'both') */}
            {(letterType === 'voice' || letterType === 'both') && (
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EADBDA] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#8B1E3F] text-white flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#4A1525] uppercase tracking-wider">
                      Record Your Voice Note
                    </h3>
                    <p className="text-[11px] text-[#8C6B73]">
                      Record yourself speaking this letter directly from your microphone!
                    </p>
                  </div>
                </div>

                {voiceAudioUrl ? (
                  <div className="p-4 bg-white rounded-xl border border-[#EADBDA] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Voice Recording Ready ({voiceDuration}s)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceAudioUrl('');
                          setVoiceDuration(0);
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                      >
                        Delete & Re-record
                      </button>
                    </div>
                    <audio controls src={voiceAudioUrl} className="w-full h-8" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {isRecording ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-mono font-bold animate-pulse">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                          <span>
                            Recording: {Math.floor(recordingSeconds / 60)}:
                            {('0' + (recordingSeconds % 60)).slice(-2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Stop & Save Recording</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="px-4 py-2.5 bg-white border border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#FFF0F2] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Microphone Recording</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#EADBDA] text-xs font-semibold text-[#6E4F57] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Back
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleTestViewAsCelebrant}
                  className="px-4 py-2 rounded-xl border border-[#8B1E3F] bg-white text-[#8B1E3F] hover:bg-[#FFF0F2] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title="Preview the letter you are working on right now"
                >
                  <Eye className="w-3.5 h-3.5 text-[#8B1E3F]" />
                  <span>Preview This Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Continue to Sound (Optional)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SOUND & MUSIC (OPTIONAL) */}
        {activeStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADBDA] shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
                  Step 3 of 5
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Sound is 100% Optional
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#4A1525] mt-1">
                Background Soundscape (Optional)
              </h2>
              <p className="text-xs text-[#8C6B73]">
                Adding background audio is completely optional! The celebrant can enjoy peaceful silent reading, or you can pick an ambient melody.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  id: 'none',
                  title: '🔇 Silent Reading (No Sound - Optional)',
                  desc: 'Pure peace. The celebrant quietly reads the letter in complete silence.',
                  isDefault: true,
                },
                {
                  id: 'acoustic-piano',
                  title: '🎹 Soft Acoustic Grand Piano',
                  desc: 'Gentle, romantic acoustic piano arpeggios crafted for deep emotion.',
                },
                {
                  id: 'lofi-sunset',
                  title: '🎸 Lo-Fi Sunset Romance',
                  desc: 'Warm vinyl texture, mellow guitar chords, and nostalgic warmth.',
                },
                {
                  id: 'cinematic-strings',
                  title: '🎻 Cinematic Warm Strings',
                  desc: 'Rich, moving orchestral string swells that feel timeless.',
                },
                {
                  id: 'golden-harp',
                  title: '🪕 Golden Celestial Harp',
                  desc: 'Dreamy, ethereal harp plucks that sparkle like stars.',
                },
                {
                  id: 'custom',
                  title: '🔗 Custom Audio Link',
                  desc: 'Paste a link to your favorite MP3 track or custom song.',
                },
              ].map((sound) => {
                const isSelected = soundtrackPreset === sound.id;
                const isPlaying = playingPreview === sound.id;
                return (
                  <div
                    key={sound.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#FFF5F6] border-[#8B1E3F] shadow-xs'
                        : 'bg-[#FAF7F2] border-[#EADBDA]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-[#4A1525]">{sound.title}</h4>
                          {sound.isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EADBDA] text-[#6E4F57]">
                              Silent
                            </span>
                          )}
                        </div>
                        {sound.id !== 'none' && sound.id !== 'custom' && (
                          <button
                            type="button"
                            onClick={() => handleToggleSoundPreview(sound.id as SoundtrackPreset)}
                            className="p-1.5 rounded-lg bg-white border border-[#EADBDA] text-xs text-[#8B1E3F] hover:bg-[#FFF0F2] cursor-pointer"
                            title="Preview sound"
                          >
                            {isPlaying ? <Square className="w-3.5 h-3.5 fill-[#8B1E3F]" /> : <Play className="w-3.5 h-3.5 fill-[#8B1E3F]" />}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8C6B73] mt-1">{sound.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSoundtrackPreset(sound.id as SoundtrackPreset)}
                      className={`mt-3 py-1.5 px-3 rounded-xl text-xs font-semibold text-center cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#8B1E3F] text-white'
                          : 'bg-white border border-[#EADBDA] text-[#6E4F57] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Choose This'}
                    </button>
                  </div>
                );
              })}
            </div>

            {soundtrackPreset === 'custom' && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EADBDA] space-y-2">
                <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider">
                  Custom Audio URL (Direct MP3 or Web Stream)
                </label>
                <input
                  type="url"
                  value={customAudioUrl}
                  onChange={(e) => setCustomAudioUrl(e.target.value)}
                  placeholder="https://example.com/romantic-song.mp3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-white text-xs font-mono focus:outline-[#8B1E3F]"
                />
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#EADBDA] text-xs font-semibold text-[#6E4F57] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Back to Letter
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {soundtrackPreset !== 'none' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSoundtrackPreset('none');
                      soundtrackEngine.stop();
                      setActiveStep(4);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#EADBDA] text-xs font-semibold text-[#8C6B73] hover:text-[#4A1525] hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    Skip Sound (Stay Silent)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Continue to Photos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PHOTO MOMENTS */}
        {activeStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADBDA] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
                Step 4 of 5
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#4A1525] mt-1">
                Visual Photo Moments
              </h2>
              <p className="text-xs text-[#8C6B73]">
                Upload pictures for the opening animated memory sequence and the scrapbook gallery.
              </p>
            </div>

            {/* Opening Loader Photos */}
            <div className="space-y-3 pb-6 border-b border-[#F0DFDE]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#4A1525] uppercase tracking-wider">
                    Opening Sequence Photos ({loaderPhotos.length}/8)
                  </h3>
                  <p className="text-[11px] text-[#8C6B73]">
                    These display when the celebrant first opens the link before the envelope unseals.
                  </p>
                </div>
                <input
                  ref={loaderInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLoaderUpload(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => loaderInputRef.current?.click()}
                  disabled={uploadingLoader || loaderPhotos.length >= 8}
                  className="px-3.5 py-1.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingLoader ? 'Compressing...' : 'Add Photos'}</span>
                </button>
              </div>

              {loaderPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {loaderPhotos.map((p, idx) => (
                    <div key={p.id} className="relative group rounded-xl overflow-hidden border border-[#EADBDA]">
                      <img src={p.url} alt="" className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => setLoaderPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scrapbook Keepsake Photos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#4A1525] uppercase tracking-wider">
                    Scrapbook Polaroids ({photos.length}/10)
                  </h3>
                  <p className="text-[11px] text-[#8C6B73]">
                    Vintage polaroids shown below the letter with decorative washi tape and captions.
                  </p>
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleGalleryUpload(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery || photos.length >= 10}
                  className="px-3.5 py-1.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingGallery ? 'Compressing...' : 'Add Polaroids'}</span>
                </button>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((p, idx) => (
                    <div key={p.id} className="relative group rounded-xl overflow-hidden border border-[#EADBDA]">
                      <img src={p.url} alt="" className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 rounded-xl border border-[#EADBDA] text-xs font-semibold text-[#6E4F57] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="px-6 py-2.5 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Review & Publish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & PUBLISH */}
        {activeStep === 5 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EADBDA] shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
                Step 5 of 5
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A1525] mt-1">
                Your Celebration is Ready! ✨
              </h2>
              <p className="text-xs text-[#8C6B73]">
                Send this personalized link to {recipientName}. When they open it, their interactive 3D envelope will unseal!
              </p>
            </div>

            {/* Celebration Summary Card */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EADBDA] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#EADBDA]">
                <span className="text-[#8C6B73]">Celebrant</span>
                <span className="font-bold text-[#4A1525] text-sm">{recipientName} ({nickname || recipientName})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EADBDA]">
                <span className="text-[#8C6B73]">Occasion</span>
                <span className="font-semibold text-[#8B1E3F] capitalize">{occasion}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EADBDA]">
                <span className="text-[#8C6B73]">Format</span>
                <span className="font-semibold text-[#4A1525] capitalize">{letterType}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#EADBDA]">
                <span className="text-[#8C6B73]">Soundtrack</span>
                <span className="font-semibold text-[#4A1525] capitalize">{soundtrackPreset}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C6B73]">Photos Added</span>
                <span className="font-semibold text-[#4A1525]">{loaderPhotos.length + photos.length} photos</span>
              </div>
            </div>

            {/* Celebrant Delivery Link & WhatsApp Delivery Hub */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#FFF5F6] via-[#FAF7F2] to-white border border-[#F5CDD3] space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0DFDE] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8B1E3F]">
                      Delivery & Sharing Hub
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Ready to Deliver
                    </span>
                  </div>
                  <p className="text-xs text-[#6E4F57] mt-0.5">
                    Share this unique celebration with {recipientName || 'your celebrant'} so they can unseal their digital envelope!
                  </p>
                </div>
              </div>

              {/* 1. Send via WhatsApp (Featured Primary Action) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-white border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <MessageCircle className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1B4D3E]">
                        Send Directly via WhatsApp
                      </h4>
                      <p className="text-xs text-[#2D6A4F]">
                        Opens WhatsApp with a tailored note and digital envelope link for {nickname || recipientName || 'your celebrant'}.
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `❤️ Dear ${nickname || recipientName || 'celebrant'}, a special celebration moment & personalized epistle has been created for you on Eyan Mi! ✨ Tap to open your envelope:\n${activeShareLink}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Send via WhatsApp Now</span>
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 text-[11px] text-[#2D6A4F] flex items-center justify-between gap-2">
                  <span className="truncate italic">
                    "❤️ Dear {nickname || recipientName || 'celebrant'}, a special celebration moment & personalized epistle has been created for you..."
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyFormattedLink(
                        'message',
                        `❤️ Dear ${nickname || recipientName || 'celebrant'}, a special celebration moment & personalized epistle has been created for you on Eyan Mi! ✨ Tap to open your envelope:\n${activeShareLink}`
                      )
                    }
                    className="shrink-0 text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFormat === 'message' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat === 'message' ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Direct Delivery Link */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#4A1525] flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-[#8B1E3F]" />
                      Celebrant Delivery Link
                    </span>
                    <span className="text-[11px] text-[#8C6B73]">Direct path: /c/{id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={cleanShareLink}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-[#D5C2C6] bg-white text-xs font-mono text-[#4A1525]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyFormattedLink('clean', cleanShareLink)}
                      className="px-4 py-2.5 rounded-xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {copiedFormat === 'clean' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFormat === 'clean' ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Optional Compact Short Link */}
                <div className="p-3 rounded-2xl bg-white border border-[#EADBDA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#4A1525]">Want a compact short link?</div>
                    <p className="text-[11px] text-[#8C6B73]">
                      Generate a compact ~20-character TinyURL for SMS or messaging.
                    </p>
                    {shortUrl && (
                      <div className="mt-1 text-xs font-mono font-bold text-emerald-700">
                        Shortened: {shortUrl}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {shortUrl ? (
                      <button
                        type="button"
                        onClick={() => handleCopyFormattedLink('short', shortUrl)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedFormat === 'short' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Short Link</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleShortenLink}
                        disabled={isShortening}
                        className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5C2C6] text-[#4A1525] text-xs font-semibold hover:bg-[#F2EAE5] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-[#8B1E3F] ${isShortening ? 'animate-spin' : ''}`} />
                        <span>{isShortening ? 'Shortening...' : '1-Click Shorten'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleTestViewAsCelebrant}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-[#8B1E3F] bg-white hover:bg-[#FFF0F2] text-[#8B1E3F] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                title="Preview the exact birthday letter you are working on"
              >
                <Eye className="w-4 h-4 text-[#8B1E3F]" />
                <span>Test View as Celebrant (Preview Draft)</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-full sm:w-auto sm:ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-[#8C6B73] hover:text-[#4A1525] cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Eyan Mi AI Epistle Generator Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#EADBDA] shadow-2xl p-6 sm:p-8 text-[#241318] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#8B1E3F] to-[#D4AF37] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#4A1525]">
                    Eyan Mi AI Epistle
                  </h3>
                  <p className="text-[11px] text-[#8C6B73]">
                    Craft an emotional, poetic letter tailored to {recipientName || 'your person'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="text-[#8C6B73] hover:text-[#4A1525] text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white border border-[#EADBDA]">
                <div>
                  <label className="block font-bold text-[#4A1525] mb-1">
                    Celebrant Full Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => handleRecipientNameChange(e.target.value)}
                    placeholder="e.g. Oluwaprecious"
                    className="w-full px-3 py-1.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-[#4A1525] focus:outline-[#8B1E3F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4A1525] mb-1">
                    Affectionate Nickname / Pet Name
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Precious, My Heart"
                    className="w-full px-3 py-1.5 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-[#4A1525] focus:outline-[#8B1E3F]"
                  />
                </div>
              </div>

              {/* Quick Inspiration Mood Chips */}
              <div>
                <label className="block font-semibold text-[#4A1525] mb-1.5">
                  Quick Mood Inspiration (Click to pre-fill):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🎂 Birthday Bliss', tone: 'deeply-emotional', occ: 'birthday', rel: 'Romantic Partner / Spouse' },
                    { label: '💍 Deep Romance', tone: 'romantic', occ: 'anniversary', rel: 'Romantic Partner / Spouse' },
                    { label: '😭 Tear-Jerker Gratitude', tone: 'tear-jerker', occ: 'appreciation', rel: 'Mentor / Cherished Person' },
                    { label: '✨ Playful Bestie', tone: 'playful', occ: 'just-because', rel: 'Best Friend' },
                    { label: '💐 Pure Appreciation', tone: 'sincere', occ: 'appreciation', rel: 'Parent' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setAiTone(chip.tone);
                        setAiRelationship(chip.rel);
                        setOccasion(chip.occ as OccasionType);
                        handleGenerateAI({
                          name: recipientName,
                          nick: nickname,
                          rel: chip.rel,
                          occ: chip.occ as OccasionType,
                          tone: chip.tone,
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#EADBDA] bg-white hover:bg-[#FFF0F2] hover:border-[#8B1E3F] text-[#6E4F57] hover:text-[#8B1E3F] transition-colors cursor-pointer text-[11px] font-medium"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#4A1525] mb-1">
                    Your Relationship
                  </label>
                  <select
                    value={aiRelationship}
                    onChange={(e) => setAiRelationship(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C2C6] bg-white text-[#4A1525]"
                  >
                    <option value="Best Friend">Best Friend</option>
                    <option value="Romantic Partner / Spouse">Romantic Partner / Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Parent">Parent</option>
                    <option value="Mentor / Cherished Person">Mentor / Cherished Person</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#4A1525] mb-1">
                    Desired Emotional Tone
                  </label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C2C6] bg-white text-[#4A1525]"
                  >
                    <option value="deeply-emotional">Deeply Emotional & Lyrical</option>
                    <option value="romantic">Poetic, Intimate & Romantic</option>
                    <option value="playful">Playful, Teasing yet Heartfelt</option>
                    <option value="tear-jerker">Tear-Jerker (Pure Gratitude & Vulnerability)</option>
                    <option value="sincere">Warm, Grounded & Sincere</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A1525] mb-1">
                  Special Memories, Habits, or Favorite Traits
                </label>
                <textarea
                  rows={2}
                  value={aiMemories}
                  onChange={(e) => setAiMemories(e.target.value)}
                  placeholder="e.g. Always shows up for family, our midnight laughs, that warm contagious smile, surviving rough seasons together..."
                  className="w-full p-2.5 rounded-xl border border-[#D5C2C6] bg-white focus:outline-[#8B1E3F] text-[#4A1525]"
                />
              </div>

              {/* Status Indicator */}
              {isGeneratingAI && (
                <div className="p-3 rounded-2xl bg-[#FFF0F2] border border-[#F5CDD3] text-[#8B1E3F] flex items-center gap-2.5 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-[#8B1E3F]" />
                  <span className="font-medium text-xs">{aiStatusMessage || 'Generating with Eyan Mi AI Epistle...'}</span>
                </div>
              )}

              {/* Generated Text Preview Area */}
              {aiGeneratedPreview && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#8B1E3F] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Generated Epistle Preview
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aiGeneratedPreview);
                          setCopiedFormat('clean');
                          setTimeout(() => setCopiedFormat(null), 2000);
                        }}
                        className="text-[11px] font-semibold text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedFormat === 'clean' ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Poetic & Ready
                      </span>
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-4 rounded-2xl bg-white border border-[#EADBDA] font-serif text-xs leading-relaxed text-[#241318] whitespace-pre-line shadow-inner">
                    {aiGeneratedPreview}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-[#F0DFDE]">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EADBDA] text-xs font-semibold text-[#6E4F57] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleGenerateAI()}
                disabled={isGeneratingAI}
                className="px-4 py-2 rounded-xl border border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#FFF0F2] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAI ? 'Writing...' : aiGeneratedPreview ? 'Regenerate' : 'Generate'}</span>
              </button>

              {aiGeneratedPreview && (
                <button
                  type="button"
                  onClick={handleApplyAIEpistle}
                  className="px-5 py-2 rounded-xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Letter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
