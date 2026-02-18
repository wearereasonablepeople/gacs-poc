import { SubmissionEntity } from '../entities';

export const SUBMISSION_REPOSITORY = Symbol('SUBMISSION_REPOSITORY');

export interface ISubmissionRepository {
  create(data: Partial<SubmissionEntity>): Promise<SubmissionEntity>;
  findOne(id: string): Promise<SubmissionEntity | null>;
  findOneWithDetails(id: string): Promise<any>;
  findByQuestionnaire(questionnaireId: string): Promise<any[]>;
  findByTenant(tenantId: string): Promise<any[]>;
  getPdfData(id: string): Promise<any>;
  exportByTenant(tenantId: string): Promise<any[]>;
  update(id: string, data: Partial<SubmissionEntity>): Promise<SubmissionEntity>;
  upsertAnswer(submissionId: string, questionId: string, selectedOptionId: string): Promise<any>;
  unlinkRespondent(respondentId: string): Promise<void>;
}
