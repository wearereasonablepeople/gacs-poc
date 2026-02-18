import { Module } from '@nestjs/common';
import { PlatformAdminsUseCase } from '../../app/usecase/platformadmins/platformadmins.usecase';
import { PlatformAdminsController } from '../../ui/controllers/platformadmins.controller';

@Module({
  providers: [PlatformAdminsUseCase],
  controllers: [PlatformAdminsController],
})
export class PlatformAdminsFeatureModule {}
