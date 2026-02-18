export interface EmailVerificationTokenEntity {
  id: string;
  respondentId: string;
  tokenHash: string;
  status: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}
