import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma.service';
import {
  PrismaRoleRepository,
  PrismaPlatformAdminRepository,
  PrismaTenantRepository,
  PrismaTenantUserRepository,
  PrismaQuestionnaireRepository,
  PrismaSectionRepository,
  PrismaQuestionRepository,
  PrismaQuestionOptionRepository,
  PrismaRespondentRepository,
  PrismaSubmissionRepository,
  PrismaAuditLogRepository,
  PrismaVerificationTokenRepository,
} from '../persistence/repositories';
import {
  ROLE_REPOSITORY,
  PLATFORM_ADMIN_REPOSITORY,
  TENANT_REPOSITORY,
  TENANT_USER_REPOSITORY,
  QUESTIONNAIRE_REPOSITORY,
  SECTION_REPOSITORY,
  QUESTION_REPOSITORY,
  QUESTION_OPTION_REPOSITORY,
  RESPONDENT_REPOSITORY,
  SUBMISSION_REPOSITORY,
  AUDIT_LOG_REPOSITORY,
  VERIFICATION_TOKEN_REPOSITORY,
} from '../../domain/repositories';

const repositoryProviders = [
  { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
  { provide: PLATFORM_ADMIN_REPOSITORY, useClass: PrismaPlatformAdminRepository },
  { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
  { provide: TENANT_USER_REPOSITORY, useClass: PrismaTenantUserRepository },
  { provide: QUESTIONNAIRE_REPOSITORY, useClass: PrismaQuestionnaireRepository },
  { provide: SECTION_REPOSITORY, useClass: PrismaSectionRepository },
  { provide: QUESTION_REPOSITORY, useClass: PrismaQuestionRepository },
  { provide: QUESTION_OPTION_REPOSITORY, useClass: PrismaQuestionOptionRepository },
  { provide: RESPONDENT_REPOSITORY, useClass: PrismaRespondentRepository },
  { provide: SUBMISSION_REPOSITORY, useClass: PrismaSubmissionRepository },
  { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  { provide: VERIFICATION_TOKEN_REPOSITORY, useClass: PrismaVerificationTokenRepository },
];

@Global()
@Module({
  providers: [PrismaService, ...repositoryProviders],
  exports: [PrismaService, ...repositoryProviders],
})
export class PersistenceModule {}
