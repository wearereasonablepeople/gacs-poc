import { Inject, Injectable } from '@nestjs/common';
import { QUESTION_OPTION_REPOSITORY, IQuestionOptionRepository } from '../../../domain/repositories';

@Injectable()
export class QuestionOptionsUseCase {
  constructor(
    @Inject(QUESTION_OPTION_REPOSITORY) private readonly optionRepo: IQuestionOptionRepository,
  ) {}

  async findByQuestion(questionId: string) {
    return this.optionRepo.findByQuestion(questionId);
  }

  async create(questionId: string, data: { label: string; groupLabel?: string; isAllowed?: boolean | null }) {
    const maxOrder = await this.optionRepo.getMaxDisplayOrder(questionId);
    const displayOrder = maxOrder + 1;
    return this.optionRepo.create({ questionId, ...data, displayOrder } as any);
  }

  async update(id: string, data: { label?: string; groupLabel?: string; isAllowed?: boolean | null }) {
    return this.optionRepo.update(id, data as any);
  }

  async reorder(questionId: string, orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.optionRepo.updateDisplayOrder(orderedIds[i], i);
    }
    return { message: 'Options reordered' };
  }

  async remove(id: string) {
    await this.optionRepo.remove(id);
    return { message: 'Option deleted' };
  }
}
