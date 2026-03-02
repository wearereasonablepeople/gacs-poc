import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
  UploadsFeatureModule,
} from './infrastructure/modules';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/api/uploads',
      serveStaticOptions: { index: false },
    }),
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
    UploadsFeatureModule,
  ],
})
export class AppModule {}
