import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PLATFORM_ADMIN_REPOSITORY, IPlatformAdminRepository } from '../../../domain/repositories';
import { TENANT_USER_REPOSITORY, ITenantUserRepository } from '../../../domain/repositories';
import { TENANT_REPOSITORY, ITenantRepository } from '../../../domain/repositories';
import { PASSWORD_HASHER_PORT, IPasswordHasher } from '../../../domain/ports';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  roleId: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
}

@Injectable()
export class AuthUseCase {
  constructor(
    @Inject(PLATFORM_ADMIN_REPOSITORY) private readonly adminRepo: IPlatformAdminRepository,
    @Inject(TENANT_USER_REPOSITORY) private readonly userRepo: ITenantUserRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
    @Inject(PASSWORD_HASHER_PORT) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async validatePlatformAdmin(email: string, password: string): Promise<SessionUser> {
    const admin = await this.adminRepo.findByEmail(email);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordHasher.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName ?? null,
      role: admin.role.name,
      roleId: admin.roleId,
    };
  }

  async validateTenantUser(email: string, password: string, tenantSlug: string): Promise<SessionUser> {
    const tenant = await this.tenantRepo.findBySlug(tenantSlug);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    const user = await this.userRepo.findByTenantAndEmail(tenant.id, email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordHasher.compare(password, (user as any).passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
      role: user.role.name,
      roleId: user.roleId,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
    };
  }

  async validate(email: string, password: string, tenantSlug?: string): Promise<SessionUser> {
    if (tenantSlug) {
      return this.validateTenantUser(email, password, tenantSlug);
    }
    return this.validatePlatformAdmin(email, password);
  }
}
