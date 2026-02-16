import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questionnaires: true, tenantUsers: true, respondents: true } } },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { questionnaires: true, tenantUsers: true, respondents: true } } },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: CreateTenantDto, createdById: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('A tenant with this slug already exists');

    return this.prisma.tenant.create({
      data: { ...dto, createdById },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  async getStats(id: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalQuestionnaires, totalSubmissions, verifiedRespondents, recentSubmissions30d] =
      await Promise.all([
        this.prisma.questionnaire.count({ where: { tenantId: id } }),
        this.prisma.submission.count({
          where: { questionnaire: { tenantId: id } },
        }),
        this.prisma.respondent.count({
          where: { tenantId: id, isEmailVerified: true },
        }),
        this.prisma.submission.count({
          where: {
            questionnaire: { tenantId: id },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

    // Recent submissions list (latest 10)
    const recentSubmissionsRaw = await this.prisma.submission.findMany({
      where: { questionnaire: { tenantId: id }, respondent: { isNot: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
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

    const recentSubmissions = recentSubmissionsRaw.map((s) => {
      const totalQuestions = s.questionnaire.sections.reduce(
        (sum, sec) => sum + sec._count.questions,
        0,
      );
      const isComplete =
        s.submittedAt && s._count.answers >= totalQuestions && totalQuestions > 0;
      return {
        id: s.id,
        respondentEmail: s.respondent?.email ?? 'Anonymous',
        questionnaireName: s.questionnaire.title,
        status: isComplete ? 'completed' : 'incomplete',
        createdAt: s.createdAt.toISOString(),
      };
    });

    // Submissions by day (last 30 days)
    const allRecentSubs = await this.prisma.submission.findMany({
      where: {
        questionnaire: { tenantId: id },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    const dayCounts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dayCounts[d.toISOString().split('T')[0]] = 0;
    }
    for (const sub of allRecentSubs) {
      const day = sub.createdAt.toISOString().split('T')[0];
      if (dayCounts[day] !== undefined) dayCounts[day]++;
    }
    const submissionsByDay = Object.entries(dayCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      totalQuestionnaires,
      totalSubmissions,
      verifiedRespondents,
      recentSubmissions30d,
      recentSubmissions,
      submissionsByDay,
    };
  }
}
