import { Module } from '@nestjs/common';
import { GdprUseCase } from '../../app/usecase/gdpr/gdpr.usecase';
import { GdprController } from '../../ui/controllers/gdpr.controller';

@Module({
  providers: [GdprUseCase],
  controllers: [GdprController],
  exports: [GdprUseCase],
})
export class GdprFeatureModule {}
