import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(rootDir, ".env") });

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export const config = {
  port: Number(process.env.PORT || 4000),
  databasePath: process.env.DATABASE_PATH
    ? path.isAbsolute(process.env.DATABASE_PATH)
      ? process.env.DATABASE_PATH
      : path.join(rootDir, process.env.DATABASE_PATH)
    : path.join(rootDir, "data/submissions.sqlite"),
  resendApiKey: optional("RESEND_API_KEY"),
  /** Full From header, e.g. `GACS Checker <onboarding@resend.dev>`. */
  mailFrom: optional("MAIL_FROM"),
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    user: optional("SMTP_USER"),
    pass: optional("SMTP_APP_PASSWORD"),
  },
  mailFromName: process.env.MAIL_FROM_NAME || "GACS Checker",
  replyTo: optional("REPLY_TO"),
  bcc: optional("BCC_EMAIL"),
  provider: {
    name: process.env.PROVIDER_NAME || "onze specialisten",
    url: optional("CONTACT_URL"),
    email: optional("CONTACT_EMAIL"),
    phone: optional("CONTACT_PHONE"),
  },
  publicWebOrigin: process.env.PUBLIC_WEB_ORIGIN || "http://localhost:5173",
};

export function assertMailConfigured() {
  if (config.resendApiKey) {
    if (!config.mailFrom) {
      throw Object.assign(
        new Error("MAIL_FROM is verplicht wanneer RESEND_API_KEY is gezet"),
        { status: 500 },
      );
    }
    return;
  }
  if (!config.smtp.user || !config.smtp.pass) {
    throw Object.assign(
      new Error(
        "Zet RESEND_API_KEY (+ MAIL_FROM), of SMTP_USER + SMTP_APP_PASSWORD",
      ),
      { status: 500 },
    );
  }
}

/** @deprecated Prefer assertMailConfigured — kept for older call sites. */
export function assertSmtpConfigured() {
  assertMailConfigured();
}
