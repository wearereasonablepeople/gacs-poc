import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ITenantRepository } from '../../../domain/repositories';
import { TenantEntity } from '../../../domain/entities';

@Injectable()
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TenantEntity[]> {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questionnaires: true, tenantUsers: true, respondents: true } } },
    }) as any;
  }

  async findOne(id: string): Promise<TenantEntity | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { questionnaires: true, tenantUsers: true, respondents: true } } },
    }) as any;
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    return this.prisma.tenant.findUnique({ where: { slug } }) as any;
  }

  async create(data: Partial<TenantEntity>): Promise<TenantEntity> {
    return this.prisma.tenant.create({ data: data as any }) as any;
  }

  async update(id: string, data: Partial<TenantEntity>): Promise<TenantEntity> {
    return this.prisma.tenant.update({ where: { id }, data: data as any }) as any;
  }

  async countQuestionnaires(tenantId: string): Promise<number> {
    return this.prisma.questionnaire.count({ where: { tenantId } });
  }

  async countSubmissions(tenantId: string): Promise<number> {
    return this.prisma.submission.count({ where: { questionnaire: { tenantId } } });
  }

  async countVerifiedRespondents(tenantId: string): Promise<number> {
    return this.prisma.respondent.count({ where: { tenantId, isEmailVerified: true } });
  }

  async countRecentSubmissions(tenantId: string, since: Date): Promise<number> {
    return this.prisma.submission.count({
      where: { questionnaire: { tenantId }, createdAt: { gte: since } },
    });
  }

  async getRecentSubmissions(tenantId: string, limit: number): Promise<any[]> {
    return this.prisma.submission.findMany({
      where: { questionnaire: { tenantId }, respondent: { isNot: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        questionnaire: {
          select: {
            title: true,
            sections: { select: { _count: { select: { questions: true } } } },
          },
        },
        respondent: { select: { email: true } },
        _count: { select: { answers: true } },
      },
    });
  }

  async getSubmissionsByDay(tenantId: string, since: Date): Promise<{ createdAt: Date }[]> {
    return this.prisma.submission.findMany({
      where: { questionnaire: { tenantId }, createdAt: { gte: since } },
      select: { createdAt: true },
    });
  }
}
