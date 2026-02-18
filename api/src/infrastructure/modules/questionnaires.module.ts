import { Module } from '@nestjs/common';
import { QuestionnairesUseCase } from '../../app/usecase/questionnaires/questionnaires.usecase';
import { QuestionnairesController } from '../../ui/controllers/questionnaires.controller';

@Module({
  providers: [QuestionnairesUseCase],
  controllers: [QuestionnairesController],
  exports: [QuestionnairesUseCase],
})
export class QuestionnairesFeatureModule {}
