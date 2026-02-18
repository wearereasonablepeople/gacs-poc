import { Module } from '@nestjs/common';
import { QuestionsUseCase } from '../../app/usecase/questions/questions.usecase';
import { QuestionsController } from '../../ui/controllers/questions.controller';

@Module({
  providers: [QuestionsUseCase],
  controllers: [QuestionsController],
})
export class QuestionsFeatureModule {}
