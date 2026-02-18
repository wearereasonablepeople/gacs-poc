import { Module } from '@nestjs/common';
import {
  PersistenceModule,
  MailInfraModule,
  AuthInfraModule,
  RolesFeatureModule,
  PlatformAdminsFeatureModule,
  TenantsFeatureModule,
  TenantUsersFeatureModule,
  QuestionnairesFeatureModule,
  SectionsFeatureModule,
  QuestionsFeatureModule,
  QuestionOptionsFeatureModule,
  SubmissionsFeatureModule,
  RespondentsFeatureModule,
  GdprFeatureModule,
} from './infrastructure/modules';

@Module({
  imports: [
    PersistenceModule,
    MailInfraModule,
    AuthInfraModule,
    RolesFeatureModule,
    PlatformAdminsFeatureModule,
    TenantsFeatureModule,
    TenantUsersFeatureModule,
    QuestionnairesFeatureModule,
    SectionsFeatureModule,
    QuestionsFeatureModule,
    QuestionOptionsFeatureModule,
    SubmissionsFeatureModule,
    RespondentsFeatureModule,
    GdprFeatureModule,
  ],
})
export class AppModule {}
