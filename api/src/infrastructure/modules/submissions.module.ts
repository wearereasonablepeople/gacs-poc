import { Module } from '@nestjs/common';
import { SubmissionsUseCase } from '../../app/usecase/submissions/submissions.usecase';
import { GdprUseCase } from '../../app/usecase/gdpr/gdpr.usecase';
import { SubmissionsController } from '../../ui/controllers/submissions.controller';

@Module({
  providers: [SubmissionsUseCase, GdprUseCase],
  controllers: [SubmissionsController],
  exports: [SubmissionsUseCase],
})
export class SubmissionsFeatureModule {}
