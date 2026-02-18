import { TenantUserEntity } from '../entities';

export const TENANT_USER_REPOSITORY = Symbol('TENANT_USER_REPOSITORY');

export interface ITenantUserRepository {
  findByTenant(tenantId: string): Promise<TenantUserEntity[]>;
  findOne(id: string): Promise<TenantUserEntity | null>;
  findByTenantAndEmail(tenantId: string, email: string): Promise<(TenantUserEntity & { role: { name: string } }) | null>;
  create(data: Partial<TenantUserEntity>): Promise<TenantUserEntity>;
  update(id: string, data: Partial<TenantUserEntity>): Promise<TenantUserEntity>;
  remove(id: string): Promise<void>;
}
