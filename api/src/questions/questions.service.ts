import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findBySection(sectionId: string) {
    return this.prisma.question.findMany({
      where: { sectionId },
      orderBy: { displayOrder: 'asc' },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
    });
  }

  async create(sectionId: string, data: { code?: string; prompt: string; helpText?: string; isRequired?: boolean }) {
    const maxOrder = await this.prisma.question.aggregate({
      where: { sectionId },
      _max: { displayOrder: true },
    });
    const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    return this.prisma.question.create({
      data: { sectionId, ...data, displayOrder },
    });
  }

  async update(id: string, data: { code?: string; prompt?: string; helpText?: string; isRequired?: boolean }) {
    return this.prisma.question.update({ where: { id }, data });
  }

  async reorder(sectionId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.question.update({ where: { id }, data: { displayOrder: index } }),
    );
    await this.prisma.$transaction(updates);
    return { message: 'Questions reordered' };
  }

  async remove(id: string) {
    await this.prisma.question.delete({ where: { id } });
    return { message: 'Question deleted' };
  }
}
