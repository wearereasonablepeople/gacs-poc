import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { IMailService } from "../../domain/ports";

@Injectable()
export class NodemailerMailService implements IMailService {
  private readonly logger = new Logger(NodemailerMailService.name);
  private transporter: nodemailer.Transporter;
  private readonly defaultVerificationTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>E-mailverificatie</h2>
      <p>Bedankt voor het invullen van de vragenlijst bij {{tenantName}}.</p>
      <p>Klik op de onderstaande link om uw e-mailadres te verifiëren en uw inzending te voltooien:</p>
      <p style="margin: 24px 0;">
        <a href="{{verificationUrl}}"
           style="background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Verifieer e-mailadres
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Deze link is 24 uur geldig. Als u deze verificatie niet heeft aangevraagd, kunt u deze e-mail negeren.
      </p>
    </div>
  `;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "1025", 10),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  async sendVerificationEmail(
    to: string,
    verificationUrl: string,
    tenantName: string,
    tenantTemplate?: string | null,
  ): Promise<void> {
    const from = process.env.SMTP_FROM || "noreply@gacs.local";
    const html = this.renderTemplate(
      tenantTemplate || this.defaultVerificationTemplate,
      {
        tenantName,
        verificationUrl,
        recipientEmail: to,
      },
    );

    await this.transporter.sendMail({
      from,
      to,
      subject: `Verifieer uw e-mailadres - ${tenantName}`,
      html,
    });

    this.logger.log(`Verification email sent to ${to}`);
  }

  async sendTenantNotificationEmail(
    to: string,
    tenantName: string,
    questionnaireTitle: string,
    respondentEmail: string,
  ): Promise<void> {
    const from = process.env.SMTP_FROM || "noreply@gacs.local";

    await this.transporter.sendMail({
      from,
      to,
      subject: `Nieuwe vragenlijst inzending - ${tenantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nieuwe inzending ontvangen</h2>
          <p>Er is een nieuwe vragenlijstinzending voor <strong>${this.escapeHtml(tenantName)}</strong>.</p>
          <p><strong>Vragenlijst:</strong> ${this.escapeHtml(questionnaireTitle)}</p>
          <p><strong>Respondent e-mail:</strong> ${this.escapeHtml(respondentEmail)}</p>
          <p style="color: #666; font-size: 14px;">
            Je kunt de details bekijken in het Reporting dashboard onder Submissions.
          </p>
        </div>
      `,
    });

    this.logger.log(`Tenant notification email sent to ${to}`);
  }

  private renderTemplate(
    template: string,
    data: {
      tenantName: string;
      verificationUrl: string;
      recipientEmail: string;
    },
  ): string {
    return template
      .replaceAll("{{tenantName}}", this.escapeHtml(data.tenantName))
      .replaceAll("{{verificationUrl}}", this.escapeHtml(data.verificationUrl))
      .replaceAll("{{recipientEmail}}", this.escapeHtml(data.recipientEmail));
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}
