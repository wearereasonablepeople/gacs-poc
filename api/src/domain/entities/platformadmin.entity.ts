import { RoleEntity } from './role.entity';

export interface PlatformAdminEntity {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: RoleEntity;
}
