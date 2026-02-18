import { QuestionEntity } from './question.entity';
import { QuestionOptionEntity } from './questionoption.entity';

export interface SubmissionAnswerEntity {
  id: string;
  submissionId: string;
  questionId: string;
  selectedOptionId: string;
  answeredAt: Date;
  question?: QuestionEntity;
  selectedOption?: QuestionOptionEntity;
}
