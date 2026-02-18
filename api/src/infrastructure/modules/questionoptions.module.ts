import { Module } from '@nestjs/common';
import { QuestionOptionsUseCase } from '../../app/usecase/questionoptions/questionoptions.usecase';
import { QuestionOptionsController } from '../../ui/controllers/questionoptions.controller';

@Module({
  providers: [QuestionOptionsUseCase],
  controllers: [QuestionOptionsController],
})
export class QuestionOptionsFeatureModule {}
