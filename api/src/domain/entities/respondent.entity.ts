export interface RespondentEntity {
  id: string;
  tenantId: string;
  email: string;
  isEmailVerified: boolean;
  verifiedAt: Date | null;
  consentGivenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
