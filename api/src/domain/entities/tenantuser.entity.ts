import { RoleEntity } from './role.entity';

export interface TenantUserEntity {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: RoleEntity;
}
