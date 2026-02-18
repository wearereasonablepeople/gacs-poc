import { Inject, Injectable } from '@nestjs/common';
import { SECTION_REPOSITORY, ISectionRepository } from '../../../domain/repositories';

@Injectable()
export class SectionsUseCase {
  constructor(
    @Inject(SECTION_REPOSITORY) private readonly sectionRepo: ISectionRepository,
  ) {}

  async findByQuestionnaire(questionnaireId: string) {
    return this.sectionRepo.findByQuestionnaire(questionnaireId);
  }

  async create(questionnaireId: string, data: { code?: string; title: string; description?: string }) {
    const maxOrder = await this.sectionRepo.getMaxDisplayOrder(questionnaireId);
    const displayOrder = maxOrder + 1;
    return this.sectionRepo.create({ questionnaireId, ...data, displayOrder } as any);
  }

  async update(id: string, data: { code?: string; title?: string; description?: string }) {
    return this.sectionRepo.update(id, data as any);
  }

  async reorder(questionnaireId: string, orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.sectionRepo.updateDisplayOrder(orderedIds[i], i);
    }
    return { message: 'Sections reordered' };
  }

  async remove(id: string) {
    await this.sectionRepo.remove(id);
    return { message: 'Section deleted' };
  }
}
