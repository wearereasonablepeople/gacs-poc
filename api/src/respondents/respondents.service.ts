import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RespondentsService {
  private readonly logger = new Logger(RespondentsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * Submit email at the end of the questionnaire.
   * Creates respondent, links to submission, sends verification email.
   */
  async submitEmail(submissionId: string, email: string, consentGiven?: boolean) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { questionnaire: { include: { tenant: true } } },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.submittedAt) throw new BadRequestException('Submission already finalized');

    const tenant = submission.questionnaire.tenant;

    // Upsert respondent (same email in same tenant = same respondent)
    const consentAt = consentGiven ? new Date() : undefined;
    const respondent = await this.prisma.respondent.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      update: consentAt ? { consentGivenAt: consentAt } : {},
      create: { tenantId: tenant.id, email, consentGivenAt: consentAt },
    });

    // Link respondent to submission
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { respondentId: respondent.id },
    });

    // Generate verification token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.emailVerificationToken.create({
      data: {
        respondentId: respondent.id,
        tokenHash,
        status: 'issued',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    const uiUrl = process.env.UI_URL || 'http://localhost:3000';
    const verificationUrl = `${uiUrl}/verify?token=${rawToken}&submission=${submissionId}`;

    await this.mailService.sendVerificationEmail(email, verificationUrl, tenant.name);

    this.logger.log(`Verification email sent to ${email} for submission ${submissionId}`);

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  /**
   * Verify email token and finalize submission.
   * Idempotent: if the token was already consumed, return success
   * instead of an error (handles React StrictMode double-calls,
   * browser prefetch, and user refreshes).
   */
  async verifyEmail(token: string, submissionId: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { respondent: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    // Already consumed → treat as success (idempotent)
    if (verificationToken.status === 'consumed') {
      this.logger.log(`Token already consumed for respondent ${verificationToken.respondentId} – returning success`);
      return { message: 'Email verified and submission finalized.' };
    }

    if (verificationToken.status === 'revoked') {
      throw new BadRequestException('Token has been revoked');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Token has expired');
    }

    // Consume token
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { status: 'consumed', consumedAt: new Date() },
    });

    // Mark respondent as verified
    await this.prisma.respondent.update({
      where: { id: verificationToken.respondentId },
      data: { isEmailVerified: true, verifiedAt: new Date() },
    });

    // Finalize submission
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { submittedAt: new Date() },
    });

    this.logger.log(`Email verified for respondent ${verificationToken.respondentId}, submission ${submissionId} finalized`);

    return { message: 'Email verified and submission finalized.' };
  }

  /** Admin: list respondents for tenant (supports email search) */
  async findByTenant(tenantId: string, search?: string) {
    const respondents = await this.prisma.respondent.findMany({
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
    });

    return respondents.map((r) => ({
      id: r.id,
      email: r.email,
      name: null, // respondents don't have names in this system
      submissionCount: r._count.submissions,
      consentGiven: !!r.consentGivenAt,
      consentDate: r.consentGivenAt?.toISOString() ?? null,
      lastActivityAt: r.submissions[0]?.createdAt.toISOString() ?? r.createdAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
