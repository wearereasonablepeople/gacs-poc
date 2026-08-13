import { randomUUID } from "node:crypto";
import {
  computeScore,
  describeAnswers,
  formatContactLines,
  getAdvice,
  type Answers,
} from "../../shared/scoring.ts";
import { config } from "./config.ts";
import { insertSubmission } from "./db.ts";
import { loadTemplate, renderTemplate, sendResultsMail } from "./mail.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildSectionScoresHtml(
  sectionScores: ReturnType<typeof computeScore>["sectionScores"],
): string {
  const rows = sectionScores
    .map((s) => {
      const pct = s.percentage === null ? "—" : `${s.percentage}%`;
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(s.title)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${s.answered} beantwoord</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${pct}</td>
      </tr>`;
    })
    .join("");
  return `<table width="100%" cellspacing="0" cellpadding="0">${rows}</table>`;
}

function buildAnswersHtml(answers: Answers): string {
  const rows = describeAnswers(answers);
  if (rows.length === 0) {
    return `<p style="margin:0;color:#6b7280;">Geen antwoorden ingevuld.</p>`;
  }
  return rows
    .map(
      (r) => `<div style="margin:0 0 14px;padding-bottom:14px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">${escapeHtml(r.sectionTitle)} · ${escapeHtml(r.code)}</p>
        <p style="margin:0 0 4px;font-size:15px;">${escapeHtml(r.prompt)}</p>
        <p style="margin:0;font-size:14px;"><strong>${escapeHtml(r.optionLabel)}</strong>
          <span style="color:${r.isAllowed ? "#047857" : "#b91c1c"};">
            (${r.isAllowed ? "toegestaan" : "niet toegestaan"})
          </span>
        </p>
      </div>`,
    )
    .join("");
}

function buildContactBlockHtml(): string {
  const lines = formatContactLines(config.provider);
  if (lines.length === 0) {
    return `<p style="margin:0;font-size:14px;opacity:0.9;">Gebruik de contactgegevens die u van ${escapeHtml(config.provider.name)} heeft ontvangen.</p>`;
  }
  const linkBits: string[] = [];
  if (config.provider.url) {
    linkBits.push(
      `<a href="${escapeHtml(config.provider.url)}" style="color:#f7f3e8;margin-right:16px;">Website</a>`,
    );
  }
  if (config.provider.email) {
    linkBits.push(
      `<a href="mailto:${escapeHtml(config.provider.email)}" style="color:#f7f3e8;margin-right:16px;">${escapeHtml(config.provider.email)}</a>`,
    );
  }
  if (config.provider.phone) {
    linkBits.push(
      `<a href="tel:${escapeHtml(config.provider.phone)}" style="color:#f7f3e8;">${escapeHtml(config.provider.phone)}</a>`,
    );
  }
  return `<p style="margin:0;">${linkBits.join("")}</p>`;
}

function buildTextBody(
  answers: Answers,
  score: ReturnType<typeof computeScore>,
  advice: string,
): string {
  const sections = score.sectionScores
    .map((s) => {
      const pct = s.percentage === null ? "—" : `${s.percentage}%`;
      return `- ${s.title}: ${pct} (${s.answered} beantwoord)`;
    })
    .join("\n");
  const answerLines = describeAnswers(answers)
    .map(
      (r) =>
        `${r.code} ${r.title}: ${r.optionLabel} (${r.isAllowed ? "toegestaan" : "niet toegestaan"})`,
    )
    .join("\n");
  const contact = formatContactLines(config.provider).join("\n");
  return [
    "Uw GACS-checklistresultaten",
    "",
    `Beantwoord: ${score.answeredCount} van ${score.totalCount}`,
    `Overall score: ${score.overall === null ? "—" : `${score.overall}%`}`,
    "",
    advice,
    "",
    "Score per sectie:",
    sections,
    "",
    "Antwoorden:",
    answerLines || "(geen)",
    "",
    `Neem contact op met ${config.provider.name}`,
    contact,
  ].join("\n");
}

export async function handleSubmission(input: {
  email: string;
  answers: Answers;
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("Ongeldig e-mailadres"), { status: 400 });
  }
  if (!input.answers || typeof input.answers !== "object") {
    throw Object.assign(new Error("Antwoorden ontbreken"), { status: 400 });
  }

  const score = computeScore(input.answers);
  const advice = getAdvice(score.overall, {
    providerName: config.provider.name,
    url: config.provider.url,
    email: config.provider.email,
    phone: config.provider.phone,
  });

  const id = randomUUID();
  insertSubmission({
    id,
    created_at: new Date().toISOString(),
    email,
    answers_json: JSON.stringify(input.answers),
    score_overall: score.overall,
    answered_count: score.answeredCount,
    allowed_count: score.allowedCount,
    advice,
  });

  const html = renderTemplate(loadTemplate(), {
    answeredSummary: `U heeft <strong>${score.answeredCount} van ${score.totalCount}</strong> control points beantwoord.`,
    overallScore: score.overall === null ? "—" : `${score.overall}%`,
    advice: escapeHtml(advice),
    sectionScoresHtml: buildSectionScoresHtml(score.sectionScores),
    answersHtml: buildAnswersHtml(input.answers),
    providerName: escapeHtml(config.provider.name),
    contactBlockHtml: buildContactBlockHtml(),
  });

  await sendResultsMail({
    to: email,
    subject: `Uw GACS-resultaten (${score.overall === null ? "geen score" : `${score.overall}%`})`,
    html,
    text: buildTextBody(input.answers, score, advice),
  });

  return { id, answeredCount: score.answeredCount };
}
