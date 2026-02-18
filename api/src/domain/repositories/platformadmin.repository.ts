import { PlatformAdminEntity } from '../entities';

export const PLATFORM_ADMIN_REPOSITORY = Symbol('PLATFORM_ADMIN_REPOSITORY');

export interface IPlatformAdminRepository {
  findAll(): Promise<PlatformAdminEntity[]>;
  findOne(id: string): Promise<PlatformAdminEntity | null>;
  findByEmail(email: string): Promise<(PlatformAdminEntity & { role: { name: string } }) | null>;
}
