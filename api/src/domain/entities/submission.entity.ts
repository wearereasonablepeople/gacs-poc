import { SubmissionAnswerEntity } from './submissionanswer.entity';
import { RespondentEntity } from './respondent.entity';
import { QuestionnaireEntity } from './questionnaire.entity';

export type SubmissionStatusFilter = 'all' | 'completed' | 'incomplete';

export interface SubmissionFilters {
  email?: string;
  questionnaire?: string;
  status?: SubmissionStatusFilter;
  createdFrom?: Date;
  createdTo?: Date;
  hasRespondent?: boolean;
}

export interface SubmissionEntity {
  id: string;
  questionnaireId: string;
  respondentId: string | null;
  startedAt: Date;
  submittedAt: Date | null;
  createdAt: Date;
  answers?: SubmissionAnswerEntity[];
  respondent?: RespondentEntity | null;
  questionnaire?: QuestionnaireEntity;
}
