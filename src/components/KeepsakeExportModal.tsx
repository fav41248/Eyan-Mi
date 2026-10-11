import React, { useState } from 'react';
import { CelebrationConfig } from '../types';
import { printKeepsakePdf, downloadKeepsakeHtml } from '../utils/pdfExport';
import {
  Printer,
  Download,
  X,
  Sparkles,
  FileText,
  Image as ImageIcon,
  QrCode,
  Heart,
  Check,
} from 'lucide-react';

interface KeepsakeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  celebration: CelebrationConfig;
  deliveryUrl?: string;
}

export const KeepsakeExportModal: React.FC<KeepsakeExportModalProps> = ({
  isOpen,
  onClose,
  celebration,
  deliveryUrl,
}) => {
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  if (!isOpen) return null;

  const celebrantName = celebration.recipientName || 'Celebrant';
  const resolvedDeliveryUrl =
    deliveryUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/c/${celebration.id || 'celebrant'}`
      : '');

  const photoCount =
    (celebration.photos?.length || 0) + (celebration.loaderPhotos?.length || 0);

  const handlePrint = () => {
    setIsExporting(true);
    printKeepsakePdf(celebration, resolvedDeliveryUrl, {
      includePhotos,
      includeQrCode,
    });
    setTimeout(() => setIsExporting(false), 1200);
  };

  const handleDownload = () => {
    setIsExporting(true);
    downloadKeepsakeHtml(celebration, resolvedDeliveryUrl, {
      includePhotos,
      includeQrCode,
    });
    setHasDownloaded(true);
    setTimeout(() => {
      setIsExporting(false);
      setTimeout(() => setHasDownloaded(false), 3000);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#EADBDA] shadow-2xl p-6 sm:p-8 text-[#241318] space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8C6B73] hover:text-[#4A1525] hover:bg-white/60 transition-colors cursor-pointer"
          aria-label="Close export dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B1E3F] to-[#D4AF37] text-white flex items-center justify-center shrink-0 shadow-md">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B1E3F] uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>Luxury Print & PDF Keepsake</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#4A1525] leading-snug">
              Export Keepsake for {celebrantName}
            </h3>
            <p className="text-xs text-[#8C6B73] mt-1">
              Produce a high-resolution, timeless parchment letter suitable for framing, scrapbooking, or saving forever.
            </p>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#EADBDA] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-[#F2EAE5] pb-2.5">
            <span className="font-serif font-bold text-[#4A1525] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#8B1E3F]" />
              <span>Keepsake Layout Preview</span>
            </span>
            <span className="text-[11px] text-[#8C6B73] font-mono">Standard A4 / US Letter</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#F0DEDB] text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8B1E3F] uppercase tracking-widest">
                Eyan Mi Parchment Edition
              </span>
              <span className="text-[10px] text-[#8C6B73]">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="font-serif font-bold text-base text-[#4A1525]">
              To Dearest {celebrantName} ❤️
            </div>
            <p className="text-xs text-[#6E4F57] line-clamp-3 italic leading-relaxed">
              "{celebration.epistleText || celebration.epistleParagraphs?.[0]?.text || 'A letter filled with genuine prayers and fond memories...'}"
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-[#E8DCDA] text-[10px] text-[#8C6B73]">
              <span>✨ Corner Gold Filigrees Included</span>
              <span>🕊️ Authentic Handwritten Styling</span>
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider">
            Export Customizations
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EADBDA] cursor-pointer hover:bg-[#FFFDFB] transition-colors">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-4 h-4 text-[#8B1E3F]" />
              <div>
                <div className="text-xs font-semibold text-[#4A1525]">
                  Include Photo Keepsakes
                </div>
                <div className="text-[11px] text-[#8C6B73]">
                  Embed {photoCount} scrapbook photograph{photoCount === 1 ? '' : 's'} at the footer
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includePhotos}
              onChange={(e) => setIncludePhotos(e.target.checked)}
              className="w-4 h-4 text-[#8B1E3F] rounded focus:ring-[#8B1E3F] accent-[#8B1E3F]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EADBDA] cursor-pointer hover:bg-[#FFFDFB] transition-colors">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-[#8B1E3F]" />
              <div>
                <div className="text-xs font-semibold text-[#4A1525]">
                  Include Interactive QR Code
                </div>
                <div className="text-[11px] text-[#8C6B73]">
                  Scan anytime to listen to voice notes & replay the digital delivery
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeQrCode}
              onChange={(e) => setIncludeQrCode(e.target.checked)}
              className="w-4 h-4 text-[#8B1E3F] rounded focus:ring-[#8B1E3F] accent-[#8B1E3F]"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isExporting}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#8B1E3F]/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as High-Quality PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full py-2.5 px-6 rounded-2xl bg-white hover:bg-[#FFF5F6] border border-[#EADBDA] text-[#8B1E3F] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {hasDownloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Keepsake Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#8B1E3F]" />
                <span>Download Printable Keepsake (.html)</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center pt-1 border-t border-[#F2EAE5]">
          <p className="text-[11px] text-[#8C6B73] flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-[#8B1E3F] fill-[#8B1E3F]" />
            <span>To save as PDF: Choose "Save as PDF" as destination in your print dialog.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
