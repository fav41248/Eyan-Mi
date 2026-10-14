import React, { useState, useEffect } from 'react';
import { CelebrationConfig } from '../types';
import { printKeepsakePdf, downloadKeepsakeHtml } from '../utils/pdfExport';
import QRCode from 'qrcode';
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
  Copy,
  ExternalLink,
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadedQr, setDownloadedQr] = useState(false);

  if (!isOpen) return null;

  const celebrantName = celebration.recipientName || 'Celebrant';
  const resolvedDeliveryUrl =
    deliveryUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/c/${celebration.id || 'celebrant'}`
      : '');

  useEffect(() => {
    if (resolvedDeliveryUrl) {
      QRCode.toDataURL(resolvedDeliveryUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#4A1525',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [resolvedDeliveryUrl]);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedDeliveryUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleDownloadQrPng = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${celebrantName.replace(/\s+/g, '_')}_eyanmi_qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedQr(true);
    setTimeout(() => setDownloadedQr(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#EADBDA] shadow-2xl p-6 sm:p-8 text-[#241318] space-y-5 max-h-[92vh] overflow-y-auto">
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
              <span>Luxury Print & Physical Gift QR Studio</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#4A1525] leading-snug">
              Keepsake & QR Code for {celebrantName}
            </h3>
            <p className="text-xs text-[#8C6B73] mt-1">
              Print luxury parchment letters or download high-resolution QR codes to attach to physical greeting cards, gift boxes, and flowers.
            </p>
          </div>
        </div>

        {/* Physical Gift QR Code Studio Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#EADBDA] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between text-xs border-b border-[#F2EAE5] pb-2.5">
            <span className="font-serif font-bold text-[#4A1525] flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#8B1E3F]" />
              <span>Physical Card & Gift QR Code</span>
            </span>
            <span className="text-[11px] text-[#8C6B73] font-mono">High-Res PNG</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#FAF7F2] p-3.5 rounded-xl border border-[#F0DEDB]">
            {qrCodeDataUrl ? (
              <div className="w-28 h-28 bg-white p-2 rounded-xl border border-[#EADBDA] shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code for ${celebrantName}`}
                  className="w-full h-full object-contain rounded"
                />
              </div>
            ) : (
              <div className="w-28 h-28 bg-white p-2 rounded-xl border border-[#EADBDA] flex items-center justify-center shrink-0 text-xs text-[#8C6B73]">
                Generating...
              </div>
            )}
            <div className="space-y-2 text-left w-full">
              <div className="text-xs font-bold text-[#4A1525]">
                Ready to Print on Physical Gifts
              </div>
              <p className="text-[11px] text-[#6E4F57] leading-relaxed">
                Scan this code with any smartphone camera to instantly open {celebrantName}'s live digital celebration, voice note, and epistle.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="px-3 py-1.5 rounded-lg bg-[#8B1E3F] hover:bg-[#721532] text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {downloadedQr ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>QR Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR PNG</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#D5C2C6] text-[#4A1525] text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8C6B73]" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-[#4A1525] uppercase tracking-wider">
            Keepsake Document Customizations
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
                  Embed QR Code in Printed Letter
                </div>
                <div className="text-[11px] text-[#8C6B73]">
                  Include the interactive QR code directly in the bottom footer of the exported PDF/HTML
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
        <div className="space-y-2 pt-1">
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
            <span>Tip: Print QR codes on stickers or greeting cards to pair with physical gifts!</span>
          </p>
        </div>
      </div>
    </div>
  );
};
