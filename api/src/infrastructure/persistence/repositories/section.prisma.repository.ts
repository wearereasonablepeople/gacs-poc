import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ISectionRepository } from '../../../domain/repositories';
import { SectionEntity } from '../../../domain/entities';

@Injectable()
export class PrismaSectionRepository implements ISectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByQuestionnaire(questionnaireId: string): Promise<SectionEntity[]> {
    return this.prisma.section.findMany({
      where: { questionnaireId },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { questions: true } } },
    }) as any;
  }

  async create(data: Partial<SectionEntity>): Promise<SectionEntity> {
    return this.prisma.section.create({ data: data as any }) as any;
  }

  async update(id: string, data: Partial<SectionEntity>): Promise<SectionEntity> {
    return this.prisma.section.update({ where: { id }, data: data as any }) as any;
  }

  async getMaxDisplayOrder(questionnaireId: string): Promise<number> {
    const result = await this.prisma.section.aggregate({
      where: { questionnaireId },
      _max: { displayOrder: true },
    });
    return result._max.displayOrder ?? -1;
  }

  async updateDisplayOrder(id: string, displayOrder: number): Promise<void> {
    await this.prisma.section.update({ where: { id }, data: { displayOrder } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.section.delete({ where: { id } });
  }
}
