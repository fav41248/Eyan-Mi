import { CelebrationConfig, GalleryPhoto } from '../types';

interface KeepsakeExportOptions {
  includePhotos?: boolean;
  includeQrCode?: boolean;
}

/**
 * Generate a luxury styled HTML document suitable for high-resolution printing
 * and "Save as PDF" browser dialog, retaining parchment styling, gold ornaments,
 * photos, and authentic typography.
 */
export function generateKeepsakeHtml(
  celebration: CelebrationConfig,
  deliveryUrl: string,
  options: KeepsakeExportOptions = { includePhotos: true, includeQrCode: true }
): string {
  const recipientName = celebration.recipientName || 'Celebrant';
  const nickname = celebration.nickname || recipientName;
  const occasion = celebration.occasion || 'Birthday Celebration';
  const finaleMessage = celebration.finaleExactMessage || 'HAPPPYYYYYYY BIRTHDAYYYYYYYYY🤭🤗🎉';

  // Compute paragraphs
  const paragraphs: string[] =
    celebration.epistleText && celebration.epistleText.trim()
      ? celebration.epistleText.trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : celebration.epistleParagraphs && celebration.epistleParagraphs.length > 0
      ? celebration.epistleParagraphs.map((p) => p.text.trim()).filter(Boolean)
      : ['A special epistle composed with endless love and fond memories.'];

  const photos: GalleryPhoto[] = options.includePhotos !== false
    ? [...(celebration.photos || []), ...(celebration.loaderPhotos || [])]
        // Deduplicate photos by url
        .filter((photo, index, self) => index === self.findIndex((p) => p.url === photo.url))
        .slice(0, 6)
    : [];

  const qrCodeUrl = options.includeQrCode !== false && deliveryUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(deliveryUrl)}&color=8B-1E-3F&bgcolor=FAF7F2`
    : '';

  const dateString = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${recipientName} - Digital Epistle Keepsake</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF7F2;
      color: #2E181F;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 13pt;
      line-height: 1.75;
    }
    .page-sheet {
      position: relative;
      background: #FFFFFF;
      border: 2px solid #E6D2C4;
      border-radius: 18px;
      padding: 38px 46px;
      box-shadow: 0 4px 20px rgba(74, 21, 37, 0.06);
      page-break-after: avoid;
    }
    /* Gold corner filigrees */
    .corner-tl, .corner-tr, .corner-bl, .corner-br {
      position: absolute;
      width: 22px;
      height: 22px;
      border-color: #D4AF37;
      pointer-events: none;
    }
    .corner-tl { top: 12px; left: 12px; border-top: 2px solid; border-left: 2px solid; }
    .corner-tr { top: 12px; right: 12px; border-top: 2px solid; border-right: 2px solid; }
    .corner-bl { bottom: 12px; left: 12px; border-bottom: 2px solid; border-left: 2px solid; }
    .corner-br { bottom: 12px; right: 12px; border-bottom: 2px solid; border-right: 2px solid; }

    .header-badge {
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 8.5pt;
      font-weight: 600;
      color: #8B1E3F;
      background: #FFF0F2;
      border: 1px solid #F5CDD3;
      padding: 4px 14px;
      border-radius: 50px;
      margin-bottom: 12px;
    }
    h1.title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28pt;
      font-weight: 700;
      color: #4A1525;
      margin: 0 0 6px 0;
      line-height: 1.2;
    }
    .subtitle {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-size: 15pt;
      color: #8C5D67;
      margin: 0 0 20px 0;
    }
    .divider {
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, transparent, #D4AF37, #8B1E3F, #D4AF37, transparent);
      margin: 18px 0 26px 0;
      opacity: 0.65;
    }
    .epistle-body {
      font-size: 12pt;
      color: #332226;
      text-align: justify;
      margin-bottom: 26px;
    }
    .epistle-body p {
      margin: 0 0 16px 0;
      line-height: 1.8;
      text-indent: 1.2em;
    }
    .epistle-body p:first-of-type {
      text-indent: 0;
    }
    .epistle-body p:first-of-type::first-letter {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 32pt;
      font-weight: 700;
      color: #8B1E3F;
      float: left;
      line-height: 0.9;
      margin-right: 8px;
      padding-top: 4px;
    }
    .finale-box {
      background: #FFF7F8;
      border: 1px dashed #F3C4CC;
      border-radius: 12px;
      padding: 16px 20px;
      text-align: center;
      margin: 24px 0;
      page-break-inside: avoid;
    }
    .finale-box h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 17pt;
      color: #8B1E3F;
      margin: 0 0 4px 0;
    }
    .finale-box p {
      margin: 0;
      font-size: 9.5pt;
      color: #7A5B64;
    }
    /* Keepsake photo grid */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 22px 0;
      page-break-inside: avoid;
    }
    .photo-card {
      background: #FFFFFF;
      border: 1px solid #E5D2C5;
      border-radius: 8px;
      padding: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      text-align: center;
    }
    .photo-card img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 5px;
      display: block;
    }
    .photo-caption {
      font-size: 8pt;
      color: #6E4F57;
      margin-top: 5px;
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #F0DFDE;
      padding-top: 18px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .signoff {
      text-align: left;
    }
    .signoff .closing {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-size: 14pt;
      color: #8B1E3F;
      margin: 0;
    }
    .signoff .author {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      font-size: 12pt;
      color: #4A1525;
      margin: 2px 0 0 0;
    }
    .qr-container {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FAF7F2;
      border: 1px solid #EADBDA;
      border-radius: 10px;
      padding: 8px 12px;
    }
    .qr-container img {
      width: 58px;
      height: 58px;
      border-radius: 6px;
      display: block;
    }
    .qr-text {
      text-align: left;
    }
    .qr-text .qr-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #8B1E3F;
      margin: 0;
    }
    .qr-text .qr-sub {
      font-size: 7.5pt;
      color: #7A5B64;
      margin: 2px 0 0 0;
      max-width: 150px;
      line-height: 1.25;
    }
    .watermark {
      text-align: center;
      font-size: 7.5pt;
      color: #BA9D9E;
      margin-top: 14px;
      letter-spacing: 0.05em;
    }

    @media screen {
      body {
        padding: 24px;
        background: #ECE5DC;
      }
      .page-sheet {
        max-width: 820px;
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <div class="page-sheet">
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="corner-bl"></div>
    <div class="corner-br"></div>

    <div style="text-align: center;">
      <span class="header-badge">✨ Official Celebration Keepsake · Eyan Mi</span>
      <h1 class="title">To Dearest ${recipientName}</h1>
      <p class="subtitle">${nickname && nickname !== recipientName ? `“${nickname}” — ` : ''}${occasion} · Preserved with Endless Affection</p>
    </div>

    <div class="divider"></div>

    <div class="epistle-body">
      ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')}
    </div>

    <div class="finale-box">
      <h2>${escapeHtml(finaleMessage)}</h2>
      <p>A sacred memory gifted on ${dateString}</p>
    </div>

    ${photos.length > 0 ? `
    <div class="photo-grid">
      ${photos.map((photo) => `
        <div class="photo-card">
          <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || 'Memory')}" />
          ${photo.caption ? `<div class="photo-caption">${escapeHtml(photo.caption)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer-section">
      <div class="signoff">
        <p class="closing">Forever celebrating you,</p>
        <p class="author">Yours Always · With Genuine Prayers & Love ❤️</p>
      </div>

      ${qrCodeUrl ? `
      <div class="qr-container">
        <img src="${qrCodeUrl}" alt="Scan to experience online" />
        <div class="qr-text">
          <p class="qr-label">Scan to Experience</p>
          <p class="qr-sub">Scan anytime with your phone camera to hear the audio & replay the celebration.</p>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="watermark">
      Crafted on Eyan Mi (eyanmi.app) · Luxury Digital & Tangible Keepsakes
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Trigger print dialog with high-quality styled HTML, opening a clean printable window
 * or iframe so the user can directly print or "Save as PDF".
 */
export function printKeepsakePdf(
  celebration: CelebrationConfig,
  deliveryUrl: string,
  options?: KeepsakeExportOptions
): void {
  const htmlContent = generateKeepsakeHtml(celebration, deliveryUrl, options);

  // Create an invisible iframe to print cleanly without popping up unwanted new browser tabs
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: popup window if iframe is restricted
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Give images and web fonts a short moment to render
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to popup:', err);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } finally {
      // Clean up iframe after printing dialog closes or completes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 750);
}

/**
 * Allow user or celebrant to download the keepsake directly as an offline printable .html file
 * which can be opened and printed from any machine or phone.
 */
export function downloadKeepsakeHtml(
  celebration: CelebrationConfig,
  deliveryUrl: string,
  options?: KeepsakeExportOptions
): void {
  const htmlContent = generateKeepsakeHtml(celebration, deliveryUrl, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (celebration.recipientName || 'celebrant').toLowerCase().replace(/[^a-z0-9]/g, '-');
  link.href = url;
  link.download = `${safeName}-birthday-epistle-keepsake.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
