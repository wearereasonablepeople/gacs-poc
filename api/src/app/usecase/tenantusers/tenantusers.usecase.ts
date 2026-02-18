import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TENANT_USER_REPOSITORY, ITenantUserRepository } from '../../../domain/repositories';
import { ROLE_REPOSITORY, IRoleRepository } from '../../../domain/repositories';
import { PASSWORD_HASHER_PORT, IPasswordHasher } from '../../../domain/ports';

function normaliseRoleName(role: string): string {
  switch (role) {
    case 'owner':
    case 'tenant_owner':
      return 'tenant_owner';
    case 'admin':
    case 'tenant_admin':
      return 'tenant_admin';
    default:
      return role;
  }
}

@Injectable()
export class TenantUsersUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY) private readonly userRepo: ITenantUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: IRoleRepository,
    @Inject(PASSWORD_HASHER_PORT) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async findByTenant(tenantId: string) {
    return this.userRepo.findByTenant(tenantId);
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne(id);
    if (!user) throw new NotFoundException('Tenant user not found');
    return user;
  }

  async create(tenantId: string, dto: { email: string; password: string; displayName?: string; role: string }) {
    const existing = await this.userRepo.findByTenantAndEmail(tenantId, dto.email);
    if (existing) throw new ConflictException('A user with this email already exists for this tenant');

    const roleName = normaliseRoleName(dto.role);
    const role = await this.roleRepo.findByName(roleName);
    if (!role) throw new BadRequestException(`Unknown role: ${dto.role}`);

    const passwordHash = await this.passwordHasher.hash(dto.password);

    return this.userRepo.create({
      tenantId,
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      roleId: role.id,
    } as any);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.userRepo.update(id, { isActive: false } as any);
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.userRepo.update(id, { isActive: true } as any);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.userRepo.remove(id);
    return { message: 'User removed' };
  }
}
