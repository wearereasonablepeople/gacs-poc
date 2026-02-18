import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TENANT_REPOSITORY, ITenantRepository } from '../../../domain/repositories';

@Injectable()
export class TenantsUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
  ) {}

  async findAll() {
    return this.tenantRepo.findAll();
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepo.findOne(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepo.findBySlug(slug);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: any, createdById: string) {
    const existing = await this.tenantRepo.findBySlug(dto.slug);
    if (existing) throw new ConflictException('A tenant with this slug already exists');
    return this.tenantRepo.create({ ...dto, createdById });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.tenantRepo.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.tenantRepo.update(id, { isActive: false });
  }

  async getStats(id: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalQuestionnaires, totalSubmissions, verifiedRespondents, recentSubmissions30d] =
      await Promise.all([
        this.tenantRepo.countQuestionnaires(id),
        this.tenantRepo.countSubmissions(id),
        this.tenantRepo.countVerifiedRespondents(id),
        this.tenantRepo.countRecentSubmissions(id, thirtyDaysAgo),
      ]);

    const recentSubmissionsRaw = await this.tenantRepo.getRecentSubmissions(id, 10);

    const recentSubmissions = recentSubmissionsRaw.map((s: any) => {
      const totalQuestions = s.questionnaire.sections.reduce(
        (sum: number, sec: any) => sum + sec._count.questions, 0,
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

    const allRecentSubs = await this.tenantRepo.getSubmissionsByDay(id, thirtyDaysAgo);

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
