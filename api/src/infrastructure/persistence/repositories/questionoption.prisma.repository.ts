import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IQuestionOptionRepository } from '../../../domain/repositories';
import { QuestionOptionEntity } from '../../../domain/entities';

@Injectable()
export class PrismaQuestionOptionRepository implements IQuestionOptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByQuestion(questionId: string): Promise<QuestionOptionEntity[]> {
    return this.prisma.questionOption.findMany({
      where: { questionId },
      orderBy: { displayOrder: 'asc' },
    }) as any;
  }

  async findOne(id: string): Promise<QuestionOptionEntity | null> {
    return this.prisma.questionOption.findUnique({ where: { id } }) as any;
  }

  async create(data: Partial<QuestionOptionEntity>): Promise<QuestionOptionEntity> {
    return this.prisma.questionOption.create({ data: data as any }) as any;
  }

  async update(id: string, data: Partial<QuestionOptionEntity>): Promise<QuestionOptionEntity> {
    return this.prisma.questionOption.update({ where: { id }, data: data as any }) as any;
  }

  async getMaxDisplayOrder(questionId: string): Promise<number> {
    const result = await this.prisma.questionOption.aggregate({
      where: { questionId },
      _max: { displayOrder: true },
    });
    return result._max.displayOrder ?? -1;
  }

  async updateDisplayOrder(id: string, displayOrder: number): Promise<void> {
    await this.prisma.questionOption.update({ where: { id }, data: { displayOrder } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.questionOption.delete({ where: { id } });
  }
}
