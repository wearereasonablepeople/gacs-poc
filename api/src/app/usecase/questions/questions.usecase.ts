import { Inject, Injectable } from '@nestjs/common';
import { QUESTION_REPOSITORY, IQuestionRepository } from '../../../domain/repositories';

@Injectable()
export class QuestionsUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY) private readonly questionRepo: IQuestionRepository,
  ) {}

  async findBySection(sectionId: string) {
    return this.questionRepo.findBySection(sectionId);
  }

  async create(sectionId: string, data: { code?: string; prompt: string; helpText?: string; imageUrl?: string; imageScale?: number; isRequired?: boolean }) {
    const maxOrder = await this.questionRepo.getMaxDisplayOrder(sectionId);
    const displayOrder = maxOrder + 1;
    return this.questionRepo.create({ sectionId, ...data, displayOrder } as any);
  }

  async update(id: string, data: { code?: string; prompt?: string; helpText?: string; imageUrl?: string; imageScale?: number; isRequired?: boolean }) {
    return this.questionRepo.update(id, data as any);
  }

  async reorder(sectionId: string, orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.questionRepo.updateDisplayOrder(orderedIds[i], i);
    }
    return { message: 'Questions reordered' };
  }

  async remove(id: string) {
    await this.questionRepo.remove(id);
    return { message: 'Question deleted' };
  }
}
