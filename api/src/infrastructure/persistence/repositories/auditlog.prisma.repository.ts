import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IAuditLogRepository } from '../../../domain/repositories';
import { AuditLogEntity } from '../../../domain/entities';

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    return this.prisma.auditLog.create({ data: data as any }) as any;
  }

  async findByTenant(tenantId: string, limit: number, offset: number): Promise<AuditLogEntity[]> {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }) as any;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.prisma.auditLog.count({ where: { tenantId } });
  }
}
