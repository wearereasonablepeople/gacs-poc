import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IRespondentRepository } from '../../../domain/repositories';
import { RespondentEntity } from '../../../domain/entities';

@Injectable()
export class PrismaRespondentRepository implements IRespondentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string, search?: string): Promise<RespondentEntity[]> {
    return this.prisma.respondent.findMany({
      where: {
        tenantId,
        ...(search ? { email: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { submissions: true } },
      },
    }) as any;
  }

  async findOne(id: string): Promise<RespondentEntity | null> {
    return this.prisma.respondent.findUnique({ where: { id } }) as any;
  }

  async findByTenantAndEmail(tenantId: string, email: string): Promise<RespondentEntity | null> {
    return this.prisma.respondent.findUnique({
      where: { tenantId_email: { tenantId, email } },
    }) as any;
  }

  async upsertByTenantEmail(tenantId: string, email: string, consentGivenAt?: Date): Promise<RespondentEntity> {
    return this.prisma.respondent.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: consentGivenAt ? { consentGivenAt } : {},
      create: { tenantId, email, consentGivenAt },
    }) as any;
  }

  async update(id: string, data: Partial<RespondentEntity>): Promise<RespondentEntity> {
    return this.prisma.respondent.update({ where: { id }, data: data as any }) as any;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.respondent.delete({ where: { id } });
  }

  async countExpired(tenantId: string, cutoff: Date): Promise<number> {
    return this.prisma.respondent.count({
      where: { tenantId, createdAt: { lt: cutoff } },
    });
  }

  async findExpired(tenantId: string, cutoff: Date): Promise<RespondentEntity[]> {
    return this.prisma.respondent.findMany({
      where: { tenantId, createdAt: { lt: cutoff } },
    }) as any;
  }

  async getWithSubmissions(id: string): Promise<any> {
    return this.prisma.respondent.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            answers: {
              include: {
                question: true,
                selectedOption: true,
              },
            },
            questionnaire: { select: { title: true, slug: true } },
          },
        },
        verificationTokens: {
          select: { status: true, createdAt: true, expiresAt: true, consumedAt: true },
        },
      },
    });
  }

  async getRespondentCountByTenant(tenantId: string, search?: string): Promise<number> {
    return this.prisma.respondent.count({
      where: {
        tenantId,
        ...(search ? { email: { contains: search, mode: 'insensitive' as const } } : {}),
      },
    });
  }
}
