import { Module } from '@nestjs/common';
import { SectionsUseCase } from '../../app/usecase/sections/sections.usecase';
import { SectionsController } from '../../ui/controllers/sections.controller';

@Module({
  providers: [SectionsUseCase],
  controllers: [SectionsController],
})
export class SectionsFeatureModule {}
