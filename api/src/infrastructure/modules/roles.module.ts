import { Module } from '@nestjs/common';
import { RolesUseCase } from '../../app/usecase/roles/roles.usecase';
import { RolesController } from '../../ui/controllers/roles.controller';

@Module({
  providers: [RolesUseCase],
  controllers: [RolesController],
  exports: [RolesUseCase],
})
export class RolesFeatureModule {}
