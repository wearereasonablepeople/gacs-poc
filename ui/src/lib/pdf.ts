import { jsPDF } from "jspdf";

export interface PdfSection {
  code: string | null;
  title: string;
  questions: {
    code: string | null;
    prompt: string;
    selectedOption: {
      label: string;
      groupLabel: string | null;
      isAllowed: boolean | null;
    } | null;
    allowedOptions: string[];
  }[];
}

export interface PdfData {
  questionnaireTitle: string;
  tenantName: string;
  respondentEmail: string | null;
  submittedAt: string | null;
  logoUrl?: string | null;
  sections: PdfSection[];
}

export interface SectionScore {
  title: string;
  code: string | null;
  scored: number;
  total: number;
  percentage: number;
}

export function computeScores(sections: PdfSection[]): {
  overall: number;
  sectionScores: SectionScore[];
} {
  let totalScored = 0;
  let totalGraded = 0;
  const sectionScores: SectionScore[] = [];

  for (const section of sections) {
    let sScored = 0;
    let sTotal = 0;
    for (const q of section.questions) {
      if (q.allowedOptions.length === 0) continue;
      sTotal++;
      if (q.selectedOption?.isAllowed === true) sScored++;
    }
    const pct = sTotal > 0 ? Math.round((sScored / sTotal) * 100) : 100;
    sectionScores.push({
      title: section.title,
      code: section.code,
      scored: sScored,
      total: sTotal,
      percentage: pct,
    });
    totalScored += sScored;
    totalGraded += sTotal;
  }

  const overall =
    totalGraded > 0 ? Math.round((totalScored / totalGraded) * 100) : 100;
  return { overall, sectionScores };
}

export function getMotivationalMessage(
  pct: number,
  tenantName: string,
): string {
  if (pct === 100) {
    return "Gefeliciteerd! Uw systeem voldoet volledig aan alle eisen. Er zijn geen verdere acties nodig.";
  }
  if (pct >= 80) {
    return `Goed resultaat! Er zijn nog enkele verbeterpunten om 100% te bereiken. Neem contact op met ${tenantName} voor gerichte ondersteuning bij de resterende punten.`;
  }
  if (pct >= 50) {
    return `Er is aanzienlijke verbetering mogelijk. Neem contact op met ${tenantName} om samen een verbeterplan op te stellen en naar een 100% score te werken.`;
  }
  return `Uw systeem vereist urgente aandacht op meerdere onderdelen. Neem vandaag nog contact op met ${tenantName} voor een volledig verbetertraject naar 100% compliance.`;
}

// ─── Colors ─────────────────────────────────────────────
const PURPLE: [number, number, number] = [88, 28, 135]; // #581C87
const GRAY_BAR: [number, number, number] = [210, 210, 210];
const DARK_TEXT: [number, number, number] = [40, 40, 40];
const MUTED_TEXT: [number, number, number] = [100, 100, 100];

// ─── Image loader ───────────────────────────────────────
function rasterizeSvg(svgText: string, width: number, height: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml,${encodeURIComponent(svgText)}`;
  });
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    if (blob.type === "image/svg+xml") {
      const svgText = await blob.text();
      return rasterizeSvg(svgText, 120, 32);
    }
    if (!blob.type.startsWith("image/")) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getImageFormat(dataUrl: string): string {
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) return "JPEG";
  if (dataUrl.includes("image/png")) return "PNG";
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "PNG";
}

const SECTION_DESCRIPTION =
  "Op basis van uw antwoorden hebben we de GACS-readiness van uw gebouw geanalyseerd. In dit overzicht vindt u per installatieonderdeel een duiding van de huidige situatie, inclusief aandachtspunten en optimalisatiemogelijkheden. De uitkomsten geven richting aan vervolgstappen om prestaties, compliance en toekomstbestendigheid verder te versterken.";

/**
 * Generate a branded PDF matching the GACS Compliance Check design.
 */
export async function generateSubmissionPdf(data: PdfData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  const ml = 15;
  const mr = 15;
  const cw = pw - ml - mr;

  const { overall, sectionScores } = computeScores(data.sections);

  // Pre-load all images
  const imagePromises: Promise<string | null>[] = [];
  const numSections = sectionScores.length;
  for (let i = 0; i <= numSections; i++) {
    imagePromises.push(loadImageAsDataUrl(`/pdf-assets/${i}.png`));
  }
  const images = await Promise.all(imagePromises);
  const coverImg = images[0];

  const logoImg = await loadImageAsDataUrl("/pdf-assets/generic-logo.svg");

  // ════════════════════════════════════════════════════════
  // PAGE 1 – COVER
  // ════════════════════════════════════════════════════════

  const safeAddImage = (img: string, x: number, y: number, w: number, h: number) => {
    try { doc.addImage(img, getImageFormat(img), x, y, w, h); } catch { /* skip broken image */ }
  };

  // Cover background image (top area)
  if (coverImg) {
    safeAddImage(coverImg, 0, 0, pw, pw * 0.75);
  }

  // Logo top-left
  if (logoImg) {
    safeAddImage(logoImg, ml, 8, 45, 12);
  }

  // Title: "GACS\nCompliance\nCheck" in large bold purple over image
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PURPLE);
  doc.text(data.questionnaireTitle || "GACS\nCompliance\nCheck", ml, 60, { maxWidth: pw * 0.55 });

  // Description text below title (left column)
  const descStartY = 115;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  const descLines = doc.splitTextToSize(SECTION_DESCRIPTION, pw * 0.42);
  doc.text(descLines, ml, descStartY);

  // Right side: "Uw compliance score:" + big percentage
  const scoreX = pw * 0.52;
  const scoreY = 110;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_TEXT);
  doc.text("Uw compliance score:", scoreX, scoreY);

  doc.setFontSize(56);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PURPLE);
  doc.text(`${overall}%`, scoreX, scoreY + 22);

  // Bar chart section
  const barStartY = 170;
  const barLabelWidth = 108;
  const barGap = 6;
  const barX = ml + barLabelWidth + barGap;
  const pctLabelWidth = 14;
  const barMaxWidth = Math.min(52, cw - barLabelWidth - barGap - pctLabelWidth - 2);
  const barHeight = 6;
  const barLabelFontSize = 8;
  const barPctFontSize = 9;
  const barLabelLineHeight = 3.2;
  const barRowGap = 2;

  let barRowY = barStartY;
  for (let i = 0; i < sectionScores.length; i++) {
    const sec = sectionScores[i];
    const label = sec.code ? `${sec.code}. ${sec.title}` : `${i + 1}. ${sec.title}`;

    doc.setFontSize(barLabelFontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    const labelLines = doc.splitTextToSize(label, barLabelWidth);
    const labelBlockHeight = labelLines.length * barLabelLineHeight;
    doc.text(labelLines, ml, barRowY + barLabelLineHeight);

    const barY = barRowY + Math.max(0, (labelBlockHeight - barHeight) / 2);

    // Background bar
    doc.setFillColor(...GRAY_BAR);
    doc.rect(barX, barY, barMaxWidth, barHeight, "F");

    // Filled bar
    const filledWidth = (sec.percentage / 100) * barMaxWidth;
    if (filledWidth > 0) {
      doc.setFillColor(...PURPLE);
      doc.rect(barX, barY, Math.max(filledWidth, 2), barHeight, "F");
    }

    // Percentage label
    doc.setFontSize(barPctFontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text(`${sec.percentage}%`, barX + barMaxWidth + 2, barRowY + barLabelLineHeight);

    barRowY += Math.max(labelBlockHeight, barHeight) + barRowGap;
  }

  // Bottom text
  const bottomY = barRowY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PURPLE);
  const bottomText = "Op de vervolgpagina's vindt u een breakdown van uw resultaten per categorie, met aanbevelingen.\nLees snel verder!";
  doc.text(bottomText, ml, bottomY, { maxWidth: cw });

  // ════════════════════════════════════════════════════════
  // CHAPTER PAGES – alternating layout (2 per page for spacious design)
  // ════════════════════════════════════════════════════════

  const sectionsPerPage = 3;
  const pageMarginTop = 12;
  const pageUsable = ph - pageMarginTop - 12;
  const sectionBlockHeight = Math.floor(pageUsable / sectionsPerPage);
  const titleFontSize = 18;
  const titleLineHeight = 7;
  const bodyFontSize = 14;
  const titleBodyGap = 4;

  for (let i = 0; i < sectionScores.length; i++) {
    const sec = sectionScores[i];
    const chapterImg = images[i + 1] || null;
    const isImageLeft = i % 2 === 0;
    const positionInPage = i % sectionsPerPage;

    if (positionInPage === 0) {
      doc.addPage();
    }

    const blockY = pageMarginTop + positionInPage * sectionBlockHeight;
    const imgW = pw * 0.38;
    const imgH = sectionBlockHeight * 0.7;
    const textW = pw * 0.5;

    const imgXLeft = ml;
    const imgXRight = pw - mr - imgW;
    const textXAfterImg = ml + imgW + 8;
    const textXStart = ml;

    const titleLabel = sec.code ? `${sec.code}. ${sec.title}` : `${i + 1}. ${sec.title}`;

    const renderSectionText = (tx: number, titleStartY: number) => {
      doc.setFontSize(titleFontSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PURPLE);
      const titleLines = doc.splitTextToSize(titleLabel, textW);
      doc.text(titleLines, tx, titleStartY);

      const bodyStartY = titleStartY + titleLines.length * titleLineHeight + titleBodyGap;
      doc.setFontSize(bodyFontSize);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_TEXT);
      const dLines = doc.splitTextToSize(SECTION_DESCRIPTION, textW - 2);
      doc.text(dLines, tx, bodyStartY, { maxWidth: textW - 2 });
    };

    if (isImageLeft) {
      if (chapterImg) {
        safeAddImage(chapterImg, imgXLeft, blockY, imgW, imgH);
      }

      renderSectionText(textXAfterImg, blockY + 10);

      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PURPLE);
      doc.text(`${sec.percentage}%`, imgXLeft, blockY + imgH + 8);
    } else {
      renderSectionText(textXStart, blockY + 10);

      if (chapterImg) {
        safeAddImage(chapterImg, imgXRight, blockY, imgW, imgH);
      }

      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PURPLE);
      doc.text(`${sec.percentage}%`, imgXRight, blockY + imgH + 8);
    }
  }

  // ─── Footer on last page ────────────────────────────────
  doc.setFontSize(14);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Gegenereerd op ${new Date().toLocaleString("nl-NL")}`,
    ml,
    ph - 8,
  );

  return doc;
}

/**
 * Build a safe filename for the PDF download.
 */
export function buildPdfFilename(questionnaireTitle: string): string {
  const safe = questionnaireTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${safe}-resultaten.pdf`;
}
