import { RoleEntity } from '../entities';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface IRoleRepository {
  findAll(): Promise<RoleEntity[]>;
  findByName(name: string): Promise<RoleEntity | null>;
}
