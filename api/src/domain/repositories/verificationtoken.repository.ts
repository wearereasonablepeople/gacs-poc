import { EmailVerificationTokenEntity } from '../entities';

export const VERIFICATION_TOKEN_REPOSITORY = Symbol('VERIFICATION_TOKEN_REPOSITORY');

export interface IVerificationTokenRepository {
  create(data: Partial<EmailVerificationTokenEntity>): Promise<EmailVerificationTokenEntity>;
  findByHash(tokenHash: string): Promise<(EmailVerificationTokenEntity & { respondent: any }) | null>;
  update(id: string, data: Partial<EmailVerificationTokenEntity>): Promise<EmailVerificationTokenEntity>;
  deleteByRespondent(respondentId: string): Promise<number>;
  deleteExpired(tenantId: string): Promise<number>;
}
