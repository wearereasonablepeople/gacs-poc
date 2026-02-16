import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async findByQuestionnaire(questionnaireId: string) {
    return this.prisma.section.findMany({
      where: { questionnaireId },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { questions: true } } },
    });
  }

  async create(questionnaireId: string, data: { code?: string; title: string; description?: string }) {
    const maxOrder = await this.prisma.section.aggregate({
      where: { questionnaireId },
      _max: { displayOrder: true },
    });
    const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    return this.prisma.section.create({
      data: { questionnaireId, ...data, displayOrder },
    });
  }

  async update(id: string, data: { code?: string; title?: string; description?: string }) {
    return this.prisma.section.update({ where: { id }, data });
  }

  async reorder(questionnaireId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.section.update({ where: { id }, data: { displayOrder: index } }),
    );
    await this.prisma.$transaction(updates);
    return { message: 'Sections reordered' };
  }

  async remove(id: string) {
    await this.prisma.section.delete({ where: { id } });
    return { message: 'Section deleted' };
  }
}
