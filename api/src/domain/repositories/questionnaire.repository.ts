import { QuestionnaireEntity } from '../entities';

export const QUESTIONNAIRE_REPOSITORY = Symbol('QUESTIONNAIRE_REPOSITORY');

export interface IQuestionnaireRepository {
  findByTenant(tenantId: string): Promise<QuestionnaireEntity[]>;
  findOne(id: string): Promise<QuestionnaireEntity | null>;
  findPublished(tenantSlug: string, questionnaireSlug: string): Promise<QuestionnaireEntity | null>;
  findByTenantAndSlug(tenantId: string, slug: string): Promise<QuestionnaireEntity | null>;
  create(data: Partial<QuestionnaireEntity>): Promise<QuestionnaireEntity>;
  update(id: string, data: Partial<QuestionnaireEntity>): Promise<QuestionnaireEntity>;
  remove(id: string): Promise<void>;
}
