import { QuestionnaireEntity } from "./questionnaire.entity";
import { RespondentEntity } from "./respondent.entity";
import { SubmissionAnswerEntity } from "./submissionanswer.entity";

export type SubmissionLeadStatus = "open" | "in_progress" | "closed";
export type SubmissionStatusFilter = "all" | SubmissionLeadStatus;

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
  leadStatus: SubmissionLeadStatus;
  startedAt: Date;
  submittedAt: Date | null;
  createdAt: Date;
  answers?: SubmissionAnswerEntity[];
  respondent?: RespondentEntity | null;
  questionnaire?: QuestionnaireEntity;
}
