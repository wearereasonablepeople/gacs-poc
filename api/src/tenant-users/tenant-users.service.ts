import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';

const SALT_ROUNDS = 12;

/** Normalise the role name coming from the DTO to the canonical role name stored in the roles table. */
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
export class TenantUsersService {
  constructor(private prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    displayName: true,
    role: { select: { id: true, name: true } },
    isActive: true,
    createdAt: true,
  } as const;

  async findByTenant(tenantId: string) {
    return this.prisma.tenantUser.findMany({
      where: { tenantId },
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.tenantUser.findUnique({
      where: { id },
      select: { ...this.userSelect, tenantId: true },
    });
    if (!user) throw new NotFoundException('Tenant user not found');
    return user;
  }

  async create(tenantId: string, dto: CreateTenantUserDto) {
    const existing = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) throw new ConflictException('A user with this email already exists for this tenant');

    // Resolve role by name
    const roleName = normaliseRoleName(dto.role);
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new BadRequestException(`Unknown role: ${dto.role}`);

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.tenantUser.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        roleId: role.id,
      },
      select: this.userSelect,
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.tenantUser.update({
      where: { id },
      data: { isActive: false },
      select: this.userSelect,
    });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.tenantUser.update({
      where: { id },
      data: { isActive: true },
      select: this.userSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tenantUser.delete({ where: { id } });
    return { message: 'User removed' };
  }
}
