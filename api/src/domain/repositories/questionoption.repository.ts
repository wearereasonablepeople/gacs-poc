import { QuestionOptionEntity } from '../entities';

export const QUESTION_OPTION_REPOSITORY = Symbol('QUESTION_OPTION_REPOSITORY');

export interface IQuestionOptionRepository {
  findByQuestion(questionId: string): Promise<QuestionOptionEntity[]>;
  findOne(id: string): Promise<QuestionOptionEntity | null>;
  create(data: Partial<QuestionOptionEntity>): Promise<QuestionOptionEntity>;
  update(id: string, data: Partial<QuestionOptionEntity>): Promise<QuestionOptionEntity>;
  getMaxDisplayOrder(questionId: string): Promise<number>;
  updateDisplayOrder(id: string, displayOrder: number): Promise<void>;
  remove(id: string): Promise<void>;
}
