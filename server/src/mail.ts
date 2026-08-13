import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { assertSmtpConfigured, config } from "./config.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "../templates/results-email.html");

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function transporter() {
  assertSmtpConfigured();
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user!,
      pass: config.smtp.pass!,
    },
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

export async function sendResultsMail(payload: MailPayload) {
  const from = `"${config.mailFromName}" <${config.smtp.user}>`;
  await transporter().sendMail({
    from,
    to: payload.to,
    bcc: config.bcc,
    replyTo: config.replyTo || config.smtp.user!,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}
