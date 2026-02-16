import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────
  // AUDIT LOGGING
  // ──────────────────────────────────────────

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
    await this.prisma.auditLog.create({ data: params });
  }

  async getAuditLog(tenantId: string, limit = 100, offset = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where: { tenantId } }),
    ]);
    return { logs, total };
  }

  // ──────────────────────────────────────────
  // DATA RETENTION
  // ──────────────────────────────────────────

  async getRetentionSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { retentionDays: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - tenant.retentionDays);

    const recordsScheduledForDeletion = await this.prisma.respondent.count({
      where: { tenantId, createdAt: { lt: cutoff } },
    });

    return {
      retentionPeriodDays: tenant.retentionDays,
      autoDeleteEnabled: tenant.retentionDays > 0,
      lastPurgeAt: null, // tracked in audit log
      recordsScheduledForDeletion,
    };
  }

  async updateRetentionSettings(tenantId: string, retentionDays: number) {
    if (retentionDays < 30 || retentionDays > 3650) {
      throw new BadRequestException('Retention period must be between 30 and 3650 days');
    }
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { retentionDays },
    });
    return { retentionPeriodDays: retentionDays };
  }

  // ──────────────────────────────────────────
  // DATA EXPORT (GDPR portability)
  // ──────────────────────────────────────────

  async exportRespondentData(respondentId: string) {
    const respondent = await this.prisma.respondent.findUnique({
      where: { id: respondentId },
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

    if (!respondent) throw new NotFoundException('Respondent not found');

    return {
      personalData: {
        email: respondent.email,
        isEmailVerified: respondent.isEmailVerified,
        verifiedAt: respondent.verifiedAt,
        consentGivenAt: respondent.consentGivenAt,
        createdAt: respondent.createdAt,
      },
      submissions: respondent.submissions.map((s) => ({
        questionnaire: s.questionnaire.title,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
        answers: s.answers.map((a) => ({
          question: a.question.prompt,
          selectedOption: a.selectedOption.label,
          answeredAt: a.answeredAt,
        })),
      })),
      verificationHistory: respondent.verificationTokens,
    };
  }

  async exportAllTenantData(tenantId: string) {
    const respondents = await this.prisma.respondent.findMany({
      where: { tenantId },
      include: {
        submissions: {
          include: {
            answers: {
              include: {
                question: { select: { code: true, prompt: true } },
                selectedOption: { select: { label: true } },
              },
            },
            questionnaire: { select: { title: true } },
          },
        },
      },
    });

    return {
      exportDate: new Date().toISOString(),
      tenantId,
      totalRespondents: respondents.length,
      respondents: respondents.map((r) => ({
        email: r.email,
        isEmailVerified: r.isEmailVerified,
        consentGivenAt: r.consentGivenAt,
        createdAt: r.createdAt,
        submissions: r.submissions.map((s) => ({
          questionnaire: s.questionnaire.title,
          startedAt: s.startedAt,
          submittedAt: s.submittedAt,
          answers: s.answers.map((a) => ({
            question: a.question.prompt,
            answer: a.selectedOption.label,
          })),
        })),
      })),
    };
  }

  // ──────────────────────────────────────────
  // DATA DELETION (GDPR erasure)
  // ──────────────────────────────────────────

  async deleteRespondentData(respondentId: string) {
    const respondent = await this.prisma.respondent.findUnique({ where: { id: respondentId } });
    if (!respondent) throw new NotFoundException('Respondent not found');

    // Remove email verification tokens
    await this.prisma.emailVerificationToken.deleteMany({
      where: { respondentId },
    });

    // Unlink submissions (anonymize - keep answers for aggregate analytics)
    await this.prisma.submission.updateMany({
      where: { respondentId },
      data: { respondentId: null },
    });

    // Delete respondent record
    await this.prisma.respondent.delete({
      where: { id: respondentId },
    });

    this.logger.log(`GDPR erasure completed for respondent ${respondentId}`);
    return { message: 'All personal data has been deleted' };
  }

  /**
   * Public: self-service erasure request by email.
   * Finds the respondent by email + tenant slug and deletes their data.
   */
  async requestErasureByEmail(email: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Organisation not found');

    const respondent = await this.prisma.respondent.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });

    if (!respondent) {
      // Don't reveal whether the email exists – return success either way
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

  // ──────────────────────────────────────────
  // DATA PURGE (retention enforcement)
  // ──────────────────────────────────────────

  async purgeExpiredData(tenantId?: string) {
    const tenants = tenantId
      ? [await this.prisma.tenant.findUnique({ where: { id: tenantId } })]
      : await this.prisma.tenant.findMany();

    let totalTokensDeleted = 0;
    let totalRespondentsAnonymized = 0;

    for (const tenant of tenants) {
      if (!tenant) continue;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - tenant.retentionDays);

      // Delete expired verification tokens
      const expiredTokens = await this.prisma.emailVerificationToken.deleteMany({
        where: {
          respondent: { tenantId: tenant.id },
          expiresAt: { lt: new Date() },
          status: { in: ['issued', 'expired'] },
        },
      });
      totalTokensDeleted += expiredTokens.count;

      // Anonymize old respondents beyond retention period
      const oldRespondents = await this.prisma.respondent.findMany({
        where: { tenantId: tenant.id, createdAt: { lt: cutoff } },
      });

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
