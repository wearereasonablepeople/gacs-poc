import {
  CHECKLIST_CONTROL_POINT_COUNT,
  checklistSections,
  type ChecklistSection,
} from "./checklist";

export type Answers = Record<string, string>; // controlPoint.code -> option.id

export type SectionScore = {
  sectionId: string;
  title: string;
  answered: number;
  allowed: number;
  percentage: number | null;
};

export type ScoreResult = {
  overall: number | null;
  answeredCount: number;
  totalCount: number;
  allowedCount: number;
  sectionScores: SectionScore[];
};

function findOption(code: string, optionId: string) {
  for (const section of checklistSections) {
    for (const cp of section.controlPoints) {
      if (cp.code !== code) continue;
      return cp.options.find((o) => o.id === optionId) ?? null;
    }
  }
  return null;
}

export function computeScore(
  answers: Answers,
  sections: ChecklistSection[] = checklistSections,
): ScoreResult {
  const sectionScores: SectionScore[] = sections.map((section) => {
    let answered = 0;
    let allowed = 0;
    for (const cp of section.controlPoints) {
      const optionId = answers[cp.code];
      if (!optionId) continue;
      const option = cp.options.find((o) => o.id === optionId);
      if (!option) continue;
      answered += 1;
      if (option.isAllowed) allowed += 1;
    }
    return {
      sectionId: section.id,
      title: section.title,
      answered,
      allowed,
      percentage: answered > 0 ? Math.round((allowed / answered) * 100) : null,
    };
  });

  const answeredCount = sectionScores.reduce((n, s) => n + s.answered, 0);
  const allowedCount = sectionScores.reduce((n, s) => n + s.allowed, 0);
  const overall =
    answeredCount > 0 ? Math.round((allowedCount / answeredCount) * 100) : null;

  return {
    overall,
    answeredCount,
    totalCount: CHECKLIST_CONTROL_POINT_COUNT,
    allowedCount,
    sectionScores,
  };
}

export type ContactConfig = {
  providerName: string;
  url?: string;
  email?: string;
  phone?: string;
};

export function getAdvice(scorePct: number | null, contact: ContactConfig): string {
  const name = contact.providerName;
  if (scorePct === null) {
    return `U heeft nog geen control points beantwoord. Neem contact op met ${name} voor hulp bij het invullen van de GACS-checklist.`;
  }
  if (scorePct === 100) {
    return `Gefeliciteerd! Op basis van uw antwoorden voldoet uw systeem volledig aan de beoordeelde eisen. Heeft u vragen over documentatie of onderhoud? Neem contact op met ${name}.`;
  }
  if (scorePct >= 80) {
    return `Goed resultaat! Er zijn nog enkele verbeterpunten om volledig te voldoen. Neem contact op met ${name} voor gerichte ondersteuning bij de resterende punten.`;
  }
  if (scorePct >= 50) {
    return `Er is aanzienlijke verbetering mogelijk. Neem contact op met ${name} om samen een verbeterplan op te stellen richting GACS-compliance.`;
  }
  return `Uw systeem vereist urgente aandacht op meerdere onderdelen. Neem vandaag nog contact op met ${name} voor een volledig verbetertraject.`;
}

export function formatContactLines(contact: ContactConfig): string[] {
  const lines: string[] = [];
  if (contact.url) lines.push(`Website: ${contact.url}`);
  if (contact.email) lines.push(`E-mail: ${contact.email}`);
  if (contact.phone) lines.push(`Telefoon: ${contact.phone}`);
  return lines;
}

export function describeAnswers(answers: Answers): Array<{
  code: string;
  title: string;
  prompt: string;
  optionLabel: string;
  isAllowed: boolean;
  sectionTitle: string;
}> {
  const rows = [];
  for (const section of checklistSections) {
    for (const cp of section.controlPoints) {
      const optionId = answers[cp.code];
      if (!optionId) continue;
      const option = findOption(cp.code, optionId);
      if (!option) continue;
      rows.push({
        code: cp.code,
        title: cp.title,
        prompt: cp.prompt,
        optionLabel: option.label,
        isAllowed: option.isAllowed,
        sectionTitle: section.title,
      });
    }
  }
  return rows;
}
