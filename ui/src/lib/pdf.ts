import { jsPDF } from 'jspdf';

export interface PdfSection {
  code: string | null;
  title: string;
  questions: {
    code: string | null;
    prompt: string;
    selectedOption: { label: string; groupLabel: string | null; isAllowed: boolean | null } | null;
    allowedOptions: string[];
  }[];
}

export interface PdfData {
  questionnaireTitle: string;
  tenantName: string;
  respondentEmail: string | null;
  submittedAt: string | null;
  sections: PdfSection[];
}

interface SectionScore {
  title: string;
  code: string | null;
  scored: number;
  total: number;
  percentage: number;
}

function computeScores(sections: PdfSection[]): { overall: number; sectionScores: SectionScore[] } {
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
    sectionScores.push({ title: section.title, code: section.code, scored: sScored, total: sTotal, percentage: pct });
    totalScored += sScored;
    totalGraded += sTotal;
  }

  const overall = totalGraded > 0 ? Math.round((totalScored / totalGraded) * 100) : 100;
  return { overall, sectionScores };
}

function getScoreColor(pct: number): [number, number, number] {
  if (pct >= 80) return [0, 130, 60];
  if (pct >= 50) return [200, 140, 0];
  return [200, 30, 30];
}

function getMotivationalMessage(pct: number, tenantName: string): string {
  if (pct === 100) {
    return 'Gefeliciteerd! Uw systeem voldoet volledig aan alle eisen. Er zijn geen verdere acties nodig.';
  }
  if (pct >= 80) {
    return `Goed resultaat! Er zijn nog enkele verbeterpunten om 100% te bereiken. Neem contact op met ${tenantName} voor gerichte ondersteuning bij de resterende punten.`;
  }
  if (pct >= 50) {
    return `Er is aanzienlijke verbetering mogelijk. Neem contact op met ${tenantName} om samen een verbeterplan op te stellen en naar een 100% score te werken.`;
  }
  return `Uw systeem vereist urgente aandacht op meerdere onderdelen. Neem vandaag nog contact op met ${tenantName} voor een volledig verbetertraject naar 100% compliance.`;
}

/**
 * Generate a PDF document from questionnaire submission data.
 * Returns the jsPDF instance so callers can either save() or output().
 */
export function generateSubmissionPdf(data: PdfData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const { overall, sectionScores } = computeScores(data.sections);

  // ---- Header ----
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.questionnaireTitle, marginLeft, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(data.tenantName, marginLeft, y);
  y += 6;

  if (data.respondentEmail) {
    doc.text(`Respondent: ${data.respondentEmail}`, marginLeft, y);
    y += 6;
  }

  if (data.submittedAt) {
    const date = new Date(data.submittedAt).toLocaleString('nl-NL');
    doc.text(`Ingediend: ${date}`, marginLeft, y);
    y += 6;
  }

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  doc.setTextColor(0, 0, 0);

  // ---- Score Overview ----
  const scoreColor = getScoreColor(overall);

  // Score badge: large percentage
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...scoreColor);
  doc.text(`${overall}%`, marginLeft, y + 2);

  // Label next to score
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Compliance Score', marginLeft + 30, y - 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  const hasGraded = sectionScores.some(s => s.total > 0);
  const totalGraded = sectionScores.reduce((s, sec) => s + sec.total, 0);
  const totalScored = sectionScores.reduce((s, sec) => s + sec.scored, 0);
  if (hasGraded) {
    doc.text(`${totalScored} van ${totalGraded} beoordeelde vragen correct beantwoord`, marginLeft + 30, y);
  }
  y += 10;

  // ---- Section Bar Chart ----
  const gradedSections = sectionScores.filter(s => s.total > 0);
  if (gradedSections.length > 0) {
    addPageIfNeeded(14 + gradedSections.length * 10);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Score per sectie', marginLeft, y);
    y += 7;

    const barX = marginLeft + 55;
    const barMaxWidth = contentWidth - 70;
    const barHeight = 6;

    for (const sec of gradedSections) {
      // Section label (truncate if too long)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const label = sec.code ? `${sec.code}. ${sec.title}` : sec.title;
      const truncated = label.length > 28 ? label.substring(0, 26) + '…' : label;
      doc.text(truncated, marginLeft, y + 4);

      // Background bar (light gray)
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(barX, y, barMaxWidth, barHeight, 1.5, 1.5, 'F');

      // Score bar (colored)
      const filledWidth = (sec.percentage / 100) * barMaxWidth;
      if (filledWidth > 0) {
        const [r, g, b] = getScoreColor(sec.percentage);
        doc.setFillColor(r, g, b);
        doc.roundedRect(barX, y, Math.max(filledWidth, 3), barHeight, 1.5, 1.5, 'F');
      }

      // Percentage label to the right of bar
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const [cr, cg, cb] = getScoreColor(sec.percentage);
      doc.setTextColor(cr, cg, cb);
      doc.text(`${sec.percentage}%`, barX + barMaxWidth + 3, y + 4.5);

      y += 9;
    }
    y += 4;
  }

  // ---- Motivational Message ----
  if (hasGraded) {
    addPageIfNeeded(24);

    // Message background box
    const msg = getMotivationalMessage(overall, data.tenantName);
    doc.setFontSize(9);
    const msgLines = doc.splitTextToSize(msg, contentWidth - 16);
    const boxHeight = msgLines.length * 4.5 + 10;

    const [br, bg, bb] = scoreColor;
    doc.setFillColor(br, bg, bb);
    doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 2, 2, 'F');

    // White text inside box
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(msgLines, marginLeft + 8, y + 7);

    y += boxHeight + 6;
  }

  // Divider before detailed answers
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  doc.setTextColor(0, 0, 0);

  // Collect non-allowed answers for the action items section
  const notAllowedItems: {
    sectionTitle: string;
    sectionCode: string | null;
    questionCode: string | null;
    questionPrompt: string;
    selectedLabel: string;
    allowedOptions: string[];
  }[] = [];

  // ---- Detailed Answers per Section ----
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Gedetailleerde antwoorden', marginLeft, y);
  y += 8;
  doc.setTextColor(0, 0, 0);

  for (const section of data.sections) {
    addPageIfNeeded(20);

    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const sectionLabel = section.code ? `${section.code}. ${section.title}` : section.title;
    doc.text(sectionLabel, marginLeft, y);
    y += 8;

    // Questions
    for (const question of section.questions) {
      addPageIfNeeded(20);

      // Question prompt
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const questionLabel = question.code ? `${question.code} – ${question.prompt}` : question.prompt;
      const questionLines = doc.splitTextToSize(questionLabel, contentWidth);
      doc.text(questionLines, marginLeft, y);
      y += questionLines.length * 4.5;

      // Answer
      doc.setFont('helvetica', 'normal');
      if (question.selectedOption) {
        const answerText = question.selectedOption.groupLabel
          ? `${question.selectedOption.groupLabel}: ${question.selectedOption.label}`
          : question.selectedOption.label;

        if (question.selectedOption.isAllowed === false) {
          doc.setTextColor(200, 30, 30);
          const answerLines = doc.splitTextToSize(`✗ ${answerText} (niet toegestaan)`, contentWidth - 5);
          doc.text(answerLines, marginLeft + 5, y);
          y += answerLines.length * 4.5;

          notAllowedItems.push({
            sectionTitle: section.title,
            sectionCode: section.code,
            questionCode: question.code,
            questionPrompt: question.prompt,
            selectedLabel: answerText,
            allowedOptions: question.allowedOptions,
          });
        } else {
          doc.setTextColor(0, 100, 0);
          const answerLines = doc.splitTextToSize(`→ ${answerText}`, contentWidth - 5);
          doc.text(answerLines, marginLeft + 5, y);
          y += answerLines.length * 4.5;
        }
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('→ Niet beantwoord', marginLeft + 5, y);
        y += 4.5;
      }

      doc.setTextColor(0, 0, 0);
      y += 3;
    }

    // Section divider
    y += 2;
    doc.setDrawColor(230, 230, 230);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 6;
  }

  // ---- Action Items: Not Allowed Answers ----
  if (notAllowedItems.length > 0) {
    addPageIfNeeded(30);

    // Section header
    doc.setDrawColor(200, 30, 30);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 30, 30);
    doc.text('Actiepunten – Niet-toegestane antwoorden', marginLeft, y);
    y += 4;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('De volgende antwoorden zijn niet toegestaan en moeten worden aangepast.', marginLeft, y);
    y += 8;

    doc.setTextColor(0, 0, 0);

    for (let i = 0; i < notAllowedItems.length; i++) {
      const item = notAllowedItems[i];
      addPageIfNeeded(25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const qLabel = item.questionCode
        ? `${i + 1}. ${item.questionCode} – ${item.questionPrompt}`
        : `${i + 1}. ${item.questionPrompt}`;
      const qLines = doc.splitTextToSize(qLabel, contentWidth);
      doc.text(qLines, marginLeft, y);
      y += qLines.length * 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 30, 30);
      const currentLines = doc.splitTextToSize(`Huidig antwoord: ${item.selectedLabel}`, contentWidth - 5);
      doc.text(currentLines, marginLeft + 5, y);
      y += currentLines.length * 4.5;

      if (item.allowedOptions.length > 0) {
        doc.setTextColor(0, 100, 0);
        doc.text('Toegestane alternatieven:', marginLeft + 5, y);
        y += 4.5;

        for (const alt of item.allowedOptions) {
          addPageIfNeeded(6);
          const altLines = doc.splitTextToSize(`  • ${alt}`, contentWidth - 10);
          doc.text(altLines, marginLeft + 5, y);
          y += altLines.length * 4.5;
        }
      }

      doc.setTextColor(0, 0, 0);
      y += 4;
    }
  }

  // ---- Footer on last page ----
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Gegenereerd op ${new Date().toLocaleString('nl-NL')}`,
    marginLeft,
    pageHeight - 10,
  );

  return doc;
}

/**
 * Build a safe filename for the PDF download.
 */
export function buildPdfFilename(questionnaireTitle: string): string {
  const safe = questionnaireTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${safe}-antwoorden.pdf`;
}
