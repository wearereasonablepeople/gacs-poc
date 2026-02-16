import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;          // role.name from the Role table (e.g. 'platform_admin', 'tenant_owner', 'tenant_admin')
  roleId: string;        // FK to the Role record
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate a platform admin login.
   */
  async validatePlatformAdmin(email: string, password: string): Promise<SessionUser> {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role.name,
      roleId: admin.roleId,
    };
  }

  /**
   * Validate a tenant user login (owner or admin).
   */
  async validateTenantUser(email: string, password: string, tenantSlug: string): Promise<SessionUser> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    const user = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      include: { role: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role.name,
      roleId: user.roleId,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
    };
  }

  /**
   * Generic validate that checks both platform_admin and tenant_user tables.
   * Used by the local strategy. The `tenantSlug` field in the body determines which path to take.
   */
  async validate(email: string, password: string, tenantSlug?: string): Promise<SessionUser> {
    if (tenantSlug) {
      return this.validateTenantUser(email, password, tenantSlug);
    }
    return this.validatePlatformAdmin(email, password);
  }
}
