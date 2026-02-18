export const MAIL_SERVICE_PORT = Symbol('MAIL_SERVICE_PORT');

export interface IMailService {
  sendVerificationEmail(to: string, verificationUrl: string, tenantName: string): Promise<void>;
}
