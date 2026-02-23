import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { IMailService, MAIL_SERVICE_PORT } from "../../../domain/ports";
import {
  IRespondentRepository,
  ISubmissionRepository,
  IVerificationTokenRepository,
  RESPONDENT_REPOSITORY,
  SUBMISSION_REPOSITORY,
  VERIFICATION_TOKEN_REPOSITORY,
} from "../../../domain/repositories";

@Injectable()
export class RespondentsUseCase {
  private readonly logger = new Logger(RespondentsUseCase.name);

  constructor(
    @Inject(RESPONDENT_REPOSITORY)
    private readonly respondentRepo: IRespondentRepository,
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissionRepo: ISubmissionRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepo: IVerificationTokenRepository,
    @Inject(MAIL_SERVICE_PORT) private readonly mailService: IMailService,
  ) {}

  async submitEmail(
    submissionId: string,
    email: string,
    consentGiven?: boolean,
  ) {
    const submission =
      await this.submissionRepo.findOneWithDetails(submissionId);
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.submittedAt)
      throw new BadRequestException("Submission already finalized");

    const tenantId = submission.questionnaire.tenantId;
    const tenantName =
      submission.questionnaire.tenant?.name || submission.questionnaire.title;

    const consentAt = consentGiven ? new Date() : undefined;
    const respondent = await this.respondentRepo.upsertByTenantEmail(
      tenantId,
      email,
      consentAt,
    );

    await this.submissionRepo.update(submissionId, {
      respondentId: respondent.id,
    } as any);

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await this.tokenRepo.create({
      respondentId: respondent.id,
      tokenHash,
      status: "issued",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    } as any);

    const uiUrl = process.env.UI_URL || "http://localhost:3000";
    const verificationUrl = `${uiUrl}/verify?token=${rawToken}&submission=${submissionId}`;
    const reportingUrl = process.env.REPORTING_URL || "http://localhost:3001";
    const submissionUrl = `${reportingUrl}/submissions?submissionId=${encodeURIComponent(submissionId)}`;

    await this.mailService.sendVerificationEmail(
      email,
      verificationUrl,
      tenantName,
      submission.questionnaire.tenant?.verificationEmailTemplate ?? null,
    );

    const notificationEmail = submission.questionnaire.tenant?.notificationEmail;
    if (notificationEmail) {
      try {
        await this.mailService.sendTenantNotificationEmail(
          notificationEmail,
          tenantName,
          submission.questionnaire.title,
          email,
          submissionUrl,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send tenant notification email to ${notificationEmail}`,
          (error as Error).stack,
        );
      }
    }

    this.logger.log(
      `Verification email sent to ${email} for submission ${submissionId}`,
    );

    return { message: "Verification email sent. Please check your inbox." };
  }

  async verifyEmail(token: string, submissionId: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const verificationToken = await this.tokenRepo.findByHash(tokenHash);

    if (!verificationToken) {
      throw new BadRequestException("Invalid verification token");
    }

    if (verificationToken.status === "consumed") {
      this.logger.log(
        `Token already consumed for respondent ${verificationToken.respondentId} – returning success`,
      );
      return { message: "Email verified and submission finalized." };
    }

    if (verificationToken.status === "revoked") {
      throw new BadRequestException("Token has been revoked");
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.tokenRepo.update(verificationToken.id, {
        status: "expired",
      } as any);
      throw new BadRequestException("Token has expired");
    }

    await this.tokenRepo.update(verificationToken.id, {
      status: "consumed",
      consumedAt: new Date(),
    } as any);

    await this.respondentRepo.update(verificationToken.respondentId, {
      isEmailVerified: true,
      verifiedAt: new Date(),
    } as any);

    await this.submissionRepo.update(submissionId, {
      submittedAt: new Date(),
    } as any);

    this.logger.log(
      `Email verified for respondent ${verificationToken.respondentId}, submission ${submissionId} finalized`,
    );

    return { message: "Email verified and submission finalized." };
  }

  async findByTenant(tenantId: string, search?: string) {
    const respondents = (await this.respondentRepo.findByTenant(
      tenantId,
      search,
    )) as any[];

    return respondents.map((r: any) => ({
      id: r.id,
      email: r.email,
      name: null,
      submissionCount: r._count?.submissions ?? 0,
      consentGiven: !!r.consentGivenAt,
      consentDate: r.consentGivenAt?.toISOString() ?? null,
      lastActivityAt:
        r.submissions?.[0]?.createdAt?.toISOString() ??
        r.createdAt?.toISOString(),
      createdAt: r.createdAt?.toISOString(),
    }));
  }
}
