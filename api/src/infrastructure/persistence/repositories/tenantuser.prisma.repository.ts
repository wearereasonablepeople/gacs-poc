import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ITenantUserRepository } from '../../../domain/repositories';
import { TenantUserEntity } from '../../../domain/entities';

@Injectable()
export class PrismaTenantUserRepository implements ITenantUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true, email: true, displayName: true,
    role: { select: { id: true, name: true } },
    isActive: true, createdAt: true,
  } as const;

  async findByTenant(tenantId: string): Promise<TenantUserEntity[]> {
    return this.prisma.tenantUser.findMany({
      where: { tenantId },
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async findOne(id: string): Promise<TenantUserEntity | null> {
    return this.prisma.tenantUser.findUnique({
      where: { id },
      select: { ...this.userSelect, tenantId: true },
    }) as any;
  }

  async findByTenantAndEmail(tenantId: string, email: string): Promise<(TenantUserEntity & { role: { name: string } }) | null> {
    return this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email } },
      include: { role: true },
    }) as any;
  }

  async create(data: Partial<TenantUserEntity>): Promise<TenantUserEntity> {
    return this.prisma.tenantUser.create({
      data: data as any,
      select: this.userSelect,
    }) as any;
  }

  async update(id: string, data: Partial<TenantUserEntity>): Promise<TenantUserEntity> {
    return this.prisma.tenantUser.update({
      where: { id },
      data: data as any,
      select: this.userSelect,
    }) as any;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.tenantUser.delete({ where: { id } });
  }
}
