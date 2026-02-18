import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IMailService } from '../../domain/ports';

@Injectable()
export class NodemailerMailService implements IMailService {
  private readonly logger = new Logger(NodemailerMailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      auth:
        process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }

  async sendVerificationEmail(to: string, verificationUrl: string, tenantName: string): Promise<void> {
    const from = process.env.SMTP_FROM || 'noreply@gacs.local';

    await this.transporter.sendMail({
      from,
      to,
      subject: `Verifieer uw e-mailadres - ${tenantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>E-mailverificatie</h2>
          <p>Bedankt voor het invullen van de vragenlijst bij ${tenantName}.</p>
          <p>Klik op de onderstaande link om uw e-mailadres te verifiëren en uw inzending te voltooien:</p>
          <p style="margin: 24px 0;">
            <a href="${verificationUrl}"
               style="background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Verifieer e-mailadres
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Deze link is 24 uur geldig. Als u deze verificatie niet heeft aangevraagd, kunt u deze e-mail negeren.
          </p>
        </div>
      `,
    });

    this.logger.log(`Verification email sent to ${to}`);
  }
}
