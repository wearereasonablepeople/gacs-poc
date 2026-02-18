import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY, IAuditLogRepository } from '../../../domain/repositories';
import { TENANT_REPOSITORY, ITenantRepository } from '../../../domain/repositories';
import { RESPONDENT_REPOSITORY, IRespondentRepository } from '../../../domain/repositories';
import { SUBMISSION_REPOSITORY, ISubmissionRepository } from '../../../domain/repositories';
import { VERIFICATION_TOKEN_REPOSITORY, IVerificationTokenRepository } from '../../../domain/repositories';

@Injectable()
export class GdprUseCase {
  private readonly logger = new Logger(GdprUseCase.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogRepo: IAuditLogRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
    @Inject(RESPONDENT_REPOSITORY) private readonly respondentRepo: IRespondentRepository,
    @Inject(SUBMISSION_REPOSITORY) private readonly submissionRepo: ISubmissionRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY) private readonly tokenRepo: IVerificationTokenRepository,
  ) {}

  async logAction(params: {
    tenantId: string;
    userId?: string;
    userEmail?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
  }) {
    await this.auditLogRepo.create(params as any);
  }

  async getAuditLog(tenantId: string, limit = 100, offset = 0) {
    const [logs, total] = await Promise.all([
      this.auditLogRepo.findByTenant(tenantId, limit, offset),
      this.auditLogRepo.countByTenant(tenantId),
    ]);
    return { logs, total };
  }

  async getRetentionSettings(tenantId: string) {
    const tenant = await this.tenantRepo.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - tenant.retentionDays);

    const recordsScheduledForDeletion = await this.respondentRepo.countExpired(tenantId, cutoff);

    return {
      retentionPeriodDays: tenant.retentionDays,
      autoDeleteEnabled: tenant.retentionDays > 0,
      lastPurgeAt: null,
      recordsScheduledForDeletion,
    };
  }

  async updateRetentionSettings(tenantId: string, retentionDays: number) {
    if (retentionDays < 30 || retentionDays > 3650) {
      throw new BadRequestException('Retention period must be between 30 and 3650 days');
    }
    await this.tenantRepo.update(tenantId, { retentionDays } as any);
    return { retentionPeriodDays: retentionDays };
  }

  async exportRespondentData(respondentId: string) {
    const respondent = await this.respondentRepo.getWithSubmissions(respondentId);
    if (!respondent) throw new NotFoundException('Respondent not found');

    return {
      personalData: {
        email: respondent.email,
        isEmailVerified: respondent.isEmailVerified,
        verifiedAt: respondent.verifiedAt,
        consentGivenAt: respondent.consentGivenAt,
        createdAt: respondent.createdAt,
      },
      submissions: respondent.submissions.map((s: any) => ({
        questionnaire: s.questionnaire.title,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
        answers: s.answers.map((a: any) => ({
          question: a.question.prompt,
          selectedOption: a.selectedOption.label,
          answeredAt: a.answeredAt,
        })),
      })),
      verificationHistory: respondent.verificationTokens,
    };
  }

  async exportAllTenantData(tenantId: string) {
    const respondents = await this.respondentRepo.findByTenant(tenantId) as any[];

    return {
      exportDate: new Date().toISOString(),
      tenantId,
      totalRespondents: respondents.length,
      respondents: respondents.map((r: any) => ({
        email: r.email,
        isEmailVerified: r.isEmailVerified,
        consentGivenAt: r.consentGivenAt,
        createdAt: r.createdAt,
        submissions: (r.submissions || []).map((s: any) => ({
          questionnaire: s.questionnaire?.title,
          startedAt: s.startedAt,
          submittedAt: s.submittedAt,
          answers: (s.answers || []).map((a: any) => ({
            question: a.question?.prompt,
            answer: a.selectedOption?.label,
          })),
        })),
      })),
    };
  }

  async deleteRespondentData(respondentId: string) {
    const respondent = await this.respondentRepo.findOne(respondentId);
    if (!respondent) throw new NotFoundException('Respondent not found');

    await this.tokenRepo.deleteByRespondent(respondentId);
    await this.submissionRepo.unlinkRespondent(respondentId);
    await this.respondentRepo.remove(respondentId);

    this.logger.log(`GDPR erasure completed for respondent ${respondentId}`);
    return { message: 'All personal data has been deleted' };
  }

  async requestErasureByEmail(email: string, tenantSlug: string) {
    if (!email || !tenantSlug) {
      throw new BadRequestException('Email and tenantSlug are required');
    }
    const tenant = await this.tenantRepo.findBySlug(tenantSlug);
    if (!tenant) throw new NotFoundException('Organisation not found');

    const respondent = await this.respondentRepo.findByTenantAndEmail(tenant.id, email);

    if (!respondent) {
      return { message: 'If your email was found, your data has been deleted.' };
    }

    await this.deleteRespondentData(respondent.id);

    await this.logAction({
      tenantId: tenant.id,
      action: 'gdpr_erasure_self_service',
      resource: 'respondent',
      resourceId: respondent.id,
      details: `Self-service erasure requested for email ${email}`,
    });

    return { message: 'If your email was found, your data has been deleted.' };
  }

  async purgeExpiredData(tenantId?: string) {
    const tenants = tenantId
      ? [await this.tenantRepo.findOne(tenantId)]
      : await this.tenantRepo.findAll();

    let totalTokensDeleted = 0;
    let totalRespondentsAnonymized = 0;

    for (const tenant of tenants) {
      if (!tenant) continue;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - tenant.retentionDays);

      const expiredTokens = await this.tokenRepo.deleteExpired(tenant.id);
      totalTokensDeleted += expiredTokens;

      const oldRespondents = await this.respondentRepo.findExpired(tenant.id, cutoff);

      for (const respondent of oldRespondents) {
        await this.deleteRespondentData(respondent.id);
      }
      totalRespondentsAnonymized += oldRespondents.length;

      if (oldRespondents.length > 0) {
        await this.logAction({
          tenantId: tenant.id,
          action: 'gdpr_auto_purge',
          resource: 'respondent',
          details: `Auto-purged ${oldRespondents.length} respondents beyond ${tenant.retentionDays}-day retention`,
        });
      }
    }

    this.logger.log(
      `GDPR purge: ${totalTokensDeleted} tokens deleted, ${totalRespondentsAnonymized} respondents anonymized`,
    );

    return {
      expiredTokensDeleted: totalTokensDeleted,
      respondentsAnonymized: totalRespondentsAnonymized,
    };
  }
}
