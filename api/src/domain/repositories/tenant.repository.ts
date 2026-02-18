import { TenantEntity } from '../entities';

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

export interface ITenantRepository {
  findAll(): Promise<TenantEntity[]>;
  findOne(id: string): Promise<TenantEntity | null>;
  findBySlug(slug: string): Promise<TenantEntity | null>;
  create(data: Partial<TenantEntity>): Promise<TenantEntity>;
  update(id: string, data: Partial<TenantEntity>): Promise<TenantEntity>;
  countQuestionnaires(tenantId: string): Promise<number>;
  countSubmissions(tenantId: string): Promise<number>;
  countVerifiedRespondents(tenantId: string): Promise<number>;
  countRecentSubmissions(tenantId: string, since: Date): Promise<number>;
  getRecentSubmissions(tenantId: string, limit: number): Promise<any[]>;
  getSubmissionsByDay(tenantId: string, since: Date): Promise<{ createdAt: Date }[]>;
}
