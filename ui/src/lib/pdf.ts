import { jsPDF } from 'jspdf';

export interface PdfSection {
  code: string | null;
  title: string;
  questions: {
    code: string | null;
    prompt: string;
    selectedOption: { label: string; groupLabel: string | null } | null;
  }[];
}

export interface PdfData {
  questionnaireTitle: string;
  tenantName: string;
  respondentEmail: string | null;
  submittedAt: string | null;
  sections: PdfSection[];
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
  y += 8;

  doc.setTextColor(0, 0, 0);

  // ---- Sections ----
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
        doc.setTextColor(0, 100, 0);
        const answerLines = doc.splitTextToSize(`→ ${answerText}`, contentWidth - 5);
        doc.text(answerLines, marginLeft + 5, y);
        y += answerLines.length * 4.5;
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
