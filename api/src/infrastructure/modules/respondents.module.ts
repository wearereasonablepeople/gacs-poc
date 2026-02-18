import { Module } from '@nestjs/common';
import { RespondentsUseCase } from '../../app/usecase/respondents/respondents.usecase';
import { RespondentsController } from '../../ui/controllers/respondents.controller';

@Module({
  providers: [RespondentsUseCase],
  controllers: [RespondentsController],
  exports: [RespondentsUseCase],
})
export class RespondentsFeatureModule {}
