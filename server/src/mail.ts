import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { assertMailConfigured, config } from "./config.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "../templates/results-email.html");

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function smtpFromAddress(): string {
  return config.mailFrom ?? `"${config.mailFromName}" <${config.smtp.user}>`;
}

function transporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user!,
      pass: config.smtp.pass!,
    },
    // Hosts that block outbound SMTP make the connect hang; without these the
    // request outlives the gateway's proxy timeout and the respondent gets a 504.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export function loadTemplate(): string {
  return fs.readFileSync(templatePath, "utf8");
}

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

async function sendViaResend(payload: MailPayload) {
  const body: Record<string, unknown> = {
    from: config.mailFrom,
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  };
  const replyTo = config.replyTo || config.smtp.user;
  if (replyTo) body.reply_to = [replyTo];
  if (config.bcc) body.bcc = [config.bcc];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend HTTP ${res.status}: ${detail.slice(0, 400)}`);
  }
}

async function sendViaSmtp(payload: MailPayload) {
  await transporter().sendMail({
    from: smtpFromAddress(),
    to: payload.to,
    bcc: config.bcc,
    replyTo: config.replyTo || config.smtp.user!,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

export async function sendResultsMail(payload: MailPayload) {
  assertMailConfigured();
  try {
    if (config.resendApiKey) {
      await sendViaResend(payload);
    } else {
      await sendViaSmtp(payload);
    }
  } catch (err) {
    console.error("Mail send failed", err);
    throw Object.assign(
      new Error(
        "De resultaten konden niet worden gemaild. Uw antwoorden zijn opgeslagen; probeer het later opnieuw.",
      ),
      { status: 502, cause: err },
    );
  }
}
