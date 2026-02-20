export const MAIL_SERVICE_PORT = Symbol("MAIL_SERVICE_PORT");

export interface IMailService {
  sendVerificationEmail(
    to: string,
    verificationUrl: string,
    tenantName: string,
    tenantTemplate?: string | null,
  ): Promise<void>;
  sendTenantNotificationEmail(
    to: string,
    tenantName: string,
    questionnaireTitle: string,
    respondentEmail: string,
  ): Promise<void>;
}
