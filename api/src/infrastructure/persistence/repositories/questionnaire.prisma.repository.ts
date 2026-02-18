import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IQuestionnaireRepository } from '../../../domain/repositories';
import { QuestionnaireEntity } from '../../../domain/entities';

@Injectable()
export class PrismaQuestionnaireRepository implements IQuestionnaireRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string): Promise<QuestionnaireEntity[]> {
    return this.prisma.questionnaire.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sections: true, submissions: true } } },
    }) as any;
  }

  async findOne(id: string): Promise<QuestionnaireEntity | null> {
    return this.prisma.questionnaire.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' },
          include: {
            questions: {
              orderBy: { displayOrder: 'asc' },
              include: { options: { orderBy: { displayOrder: 'asc' } } },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
    }) as any;
  }

  async findPublished(tenantSlug: string, questionnaireSlug: string): Promise<QuestionnaireEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.isActive) return null;

    return this.prisma.questionnaire.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: questionnaireSlug } },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' },
          include: {
            questions: {
              orderBy: { displayOrder: 'asc' },
              include: { options: { orderBy: { displayOrder: 'asc' } } },
            },
          },
        },
        tenant: {
          select: {
            id: true, slug: true, name: true, primaryColor: true,
            secondaryColor: true, headerTextColor: true, subtextColor: true,
            logoUrl: true, faviconUrl: true,
          },
        },
      },
    }) as any;
  }

  async findByTenantAndSlug(tenantId: string, slug: string): Promise<QuestionnaireEntity | null> {
    return this.prisma.questionnaire.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    }) as any;
  }

  async create(data: Partial<QuestionnaireEntity>): Promise<QuestionnaireEntity> {
    return this.prisma.questionnaire.create({ data: data as any }) as any;
  }

  async update(id: string, data: Partial<QuestionnaireEntity>): Promise<QuestionnaireEntity> {
    return this.prisma.questionnaire.update({ where: { id }, data: data as any }) as any;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.questionnaire.delete({ where: { id } });
  }
}
