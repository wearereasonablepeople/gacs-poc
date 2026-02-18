import { AuditLogEntity } from '../entities';

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface IAuditLogRepository {
  create(data: Partial<AuditLogEntity>): Promise<AuditLogEntity>;
  findByTenant(tenantId: string, limit: number, offset: number): Promise<AuditLogEntity[]>;
  countByTenant(tenantId: string): Promise<number>;
}
