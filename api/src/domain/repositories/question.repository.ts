import { QuestionEntity } from '../entities';

export const QUESTION_REPOSITORY = Symbol('QUESTION_REPOSITORY');

export interface IQuestionRepository {
  findBySection(sectionId: string): Promise<QuestionEntity[]>;
  create(data: Partial<QuestionEntity>): Promise<QuestionEntity>;
  update(id: string, data: Partial<QuestionEntity>): Promise<QuestionEntity>;
  getMaxDisplayOrder(sectionId: string): Promise<number>;
  updateDisplayOrder(id: string, displayOrder: number): Promise<void>;
  remove(id: string): Promise<void>;
}
