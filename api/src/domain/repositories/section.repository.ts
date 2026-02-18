import { SectionEntity } from '../entities';

export const SECTION_REPOSITORY = Symbol('SECTION_REPOSITORY');

export interface ISectionRepository {
  findByQuestionnaire(questionnaireId: string): Promise<SectionEntity[]>;
  create(data: Partial<SectionEntity>): Promise<SectionEntity>;
  update(id: string, data: Partial<SectionEntity>): Promise<SectionEntity>;
  getMaxDisplayOrder(questionnaireId: string): Promise<number>;
  updateDisplayOrder(id: string, displayOrder: number): Promise<void>;
  remove(id: string): Promise<void>;
}
