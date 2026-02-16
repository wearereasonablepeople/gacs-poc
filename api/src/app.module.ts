import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { TenantsModule } from './tenants/tenants.module';
import { TenantUsersModule } from './tenant-users/tenant-users.module';
import { QuestionnairesModule } from './questionnaires/questionnaires.module';
import { SectionsModule } from './sections/sections.module';
import { QuestionsModule } from './questions/questions.module';
import { QuestionOptionsModule } from './question-options/question-options.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { RespondentsModule } from './respondents/respondents.module';
import { PlatformAdminsModule } from './platform-admins/platform-admins.module';
import { MailModule } from './mail/mail.module';
import { GdprModule } from './gdpr/gdpr.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RolesModule,
    MailModule,
    GdprModule,
    PlatformAdminsModule,
    TenantsModule,
    TenantUsersModule,
    QuestionnairesModule,
    SectionsModule,
    QuestionsModule,
    QuestionOptionsModule,
    SubmissionsModule,
    RespondentsModule,
  ],
})
export class AppModule {}
