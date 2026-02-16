import { SetMetadata } from '@nestjs/common';

/**
 * Application role names — these must match the `name` column in the `roles` table.
 */
export const APP_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_OWNER: 'tenant_owner',
  TENANT_ADMIN: 'tenant_admin',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
