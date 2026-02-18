import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IQuestionRepository } from '../../../domain/repositories';
import { QuestionEntity } from '../../../domain/entities';

@Injectable()
export class PrismaQuestionRepository implements IQuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySection(sectionId: string): Promise<QuestionEntity[]> {
    return this.prisma.question.findMany({
      where: { sectionId },
      orderBy: { displayOrder: 'asc' },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
    }) as any;
  }

  async create(data: Partial<QuestionEntity>): Promise<QuestionEntity> {
    return this.prisma.question.create({ data: data as any }) as any;
  }

  async update(id: string, data: Partial<QuestionEntity>): Promise<QuestionEntity> {
    return this.prisma.question.update({ where: { id }, data: data as any }) as any;
  }

  async getMaxDisplayOrder(sectionId: string): Promise<number> {
    const result = await this.prisma.question.aggregate({
      where: { sectionId },
      _max: { displayOrder: true },
    });
    return result._max.displayOrder ?? -1;
  }

  async updateDisplayOrder(id: string, displayOrder: number): Promise<void> {
    await this.prisma.question.update({ where: { id }, data: { displayOrder } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.question.delete({ where: { id } });
  }
}
