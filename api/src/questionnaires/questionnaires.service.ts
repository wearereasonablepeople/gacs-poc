import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';

@Injectable()
export class QuestionnairesService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    return this.prisma.questionnaire.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sections: true, submissions: true } } },
    });
  }

  async findOne(id: string) {
    const q = await this.prisma.questionnaire.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' },
          include: {
            questions: {
              orderBy: { displayOrder: 'asc' },
              include: {
                options: { orderBy: { displayOrder: 'asc' } },
              },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
    });
    if (!q) throw new NotFoundException('Questionnaire not found');
    return q;
  }

  /** Public: fetch a published questionnaire by tenant slug + questionnaire slug */
  async findPublished(tenantSlug: string, questionnaireSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.isActive) throw new NotFoundException('Tenant not found');

    const q = await this.prisma.questionnaire.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: questionnaireSlug } },
      include: {
        sections: {
          orderBy: { displayOrder: 'asc' },
          include: {
            questions: {
              orderBy: { displayOrder: 'asc' },
              include: {
                options: { orderBy: { displayOrder: 'asc' } },
              },
            },
          },
        },
        tenant: {
          select: { id: true, slug: true, name: true, primaryColor: true, secondaryColor: true, headerTextColor: true, subtextColor: true, logoUrl: true, faviconUrl: true },
        },
      },
    });

    if (!q || !q.isPublished) throw new NotFoundException('Questionnaire not found or not published');
    return q;
  }

  async create(tenantId: string, createdById: string, dto: CreateQuestionnaireDto) {
    const existing = await this.prisma.questionnaire.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });
    if (existing) throw new ConflictException('A questionnaire with this slug already exists');

    return this.prisma.questionnaire.create({
      data: { tenantId, createdById, ...dto },
    });
  }

  async update(id: string, dto: Partial<CreateQuestionnaireDto>) {
    await this.findOne(id);
    return this.prisma.questionnaire.update({ where: { id }, data: dto });
  }

  async publish(id: string) {
    await this.findOne(id);
    return this.prisma.questionnaire.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    await this.findOne(id);
    return this.prisma.questionnaire.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.questionnaire.delete({ where: { id } });
    return { message: 'Questionnaire deleted' };
  }
}
