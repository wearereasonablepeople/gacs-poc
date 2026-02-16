import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionOptionsService {
  constructor(private prisma: PrismaService) {}

  async findByQuestion(questionId: string) {
    return this.prisma.questionOption.findMany({
      where: { questionId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(questionId: string, data: { label: string; groupLabel?: string }) {
    const maxOrder = await this.prisma.questionOption.aggregate({
      where: { questionId },
      _max: { displayOrder: true },
    });
    const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    return this.prisma.questionOption.create({
      data: { questionId, ...data, displayOrder },
    });
  }

  async update(id: string, data: { label?: string; groupLabel?: string }) {
    return this.prisma.questionOption.update({ where: { id }, data });
  }

  async reorder(questionId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.questionOption.update({ where: { id }, data: { displayOrder: index } }),
    );
    await this.prisma.$transaction(updates);
    return { message: 'Options reordered' };
  }

  async remove(id: string) {
    await this.prisma.questionOption.delete({ where: { id } });
    return { message: 'Option deleted' };
  }
}
