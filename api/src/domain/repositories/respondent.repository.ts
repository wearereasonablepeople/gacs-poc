import { RespondentEntity } from '../entities';

export const RESPONDENT_REPOSITORY = Symbol('RESPONDENT_REPOSITORY');

export interface IRespondentRepository {
  findByTenant(tenantId: string, search?: string): Promise<RespondentEntity[]>;
  findOne(id: string): Promise<RespondentEntity | null>;
  findByTenantAndEmail(tenantId: string, email: string): Promise<RespondentEntity | null>;
  upsertByTenantEmail(tenantId: string, email: string, consentGivenAt?: Date): Promise<RespondentEntity>;
  update(id: string, data: Partial<RespondentEntity>): Promise<RespondentEntity>;
  remove(id: string): Promise<void>;
  countExpired(tenantId: string, cutoff: Date): Promise<number>;
  findExpired(tenantId: string, cutoff: Date): Promise<RespondentEntity[]>;
  getWithSubmissions(id: string): Promise<any>;
  getRespondentCountByTenant(tenantId: string, search?: string): Promise<number>;
}
