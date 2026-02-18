import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ISubmissionRepository } from '../../../domain/repositories';
import { SubmissionEntity } from '../../../domain/entities';

@Injectable()
export class PrismaSubmissionRepository implements ISubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<SubmissionEntity>): Promise<SubmissionEntity> {
    return this.prisma.submission.create({ data: data as any }) as any;
  }

  async findOne(id: string): Promise<SubmissionEntity | null> {
    return this.prisma.submission.findUnique({ where: { id } }) as any;
  }

  async findOneWithDetails(id: string): Promise<any> {
    return this.prisma.submission.findUnique({
      where: { id },
      include: {
        answers: {
          include: {
            question: { select: { id: true, code: true, prompt: true } },
            selectedOption: { select: { id: true, label: true, groupLabel: true } },
          },
        },
        respondent: { select: { id: true, email: true, isEmailVerified: true } },
        questionnaire: {
          select: {
            id: true, tenantId: true, title: true, slug: true,
            tenant: { select: { id: true, name: true } },
            sections: { select: { _count: { select: { questions: true } } } },
          },
        },
      },
    });
  }

  async findByQuestionnaire(questionnaireId: string): Promise<any[]> {
    return this.prisma.submission.findMany({
      where: { questionnaireId },
      orderBy: { createdAt: 'desc' },
      include: {
        respondent: { select: { email: true, isEmailVerified: true } },
        questionnaire: {
          select: { sections: { select: { _count: { select: { questions: true } } } } },
        },
        _count: { select: { answers: true } },
      },
    });
  }

  async findByTenant(tenantId: string): Promise<any[]> {
    return this.prisma.submission.findMany({
      where: { questionnaire: { tenantId } },
      orderBy: { createdAt: 'desc' },
      include: {
        questionnaire: {
          select: {
            title: true, slug: true,
            sections: { select: { _count: { select: { questions: true } } } },
          },
        },
        respondent: { select: { email: true, isEmailVerified: true } },
        _count: { select: { answers: true } },
      },
    });
  }

  async getPdfData(id: string): Promise<any> {
    return this.prisma.submission.findUnique({
      where: { id },
      include: {
        answers: {
          include: {
            question: { select: { id: true, code: true, prompt: true } },
            selectedOption: { select: { id: true, label: true, groupLabel: true } },
          },
        },
        respondent: { select: { id: true, email: true, isEmailVerified: true } },
        questionnaire: {
          include: {
            tenant: {
              select: {
                name: true, slug: true, logoUrl: true, primaryColor: true,
                secondaryColor: true, headerTextColor: true, subtextColor: true,
                faviconUrl: true,
              },
            },
            sections: {
              orderBy: { displayOrder: 'asc' },
              include: {
                questions: {
                  orderBy: { displayOrder: 'asc' },
                  include: { options: { orderBy: { displayOrder: 'asc' } } },
                },
              },
            },
          },
        },
      },
    });
  }

  async exportByTenant(tenantId: string): Promise<any[]> {
    return this.prisma.submission.findMany({
      where: { questionnaire: { tenantId }, submittedAt: { not: null } },
      include: {
        questionnaire: { select: { title: true } },
        respondent: { select: { email: true } },
        answers: {
          include: {
            question: { select: { code: true, prompt: true } },
            selectedOption: { select: { label: true, groupLabel: true } },
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<SubmissionEntity>): Promise<SubmissionEntity> {
    return this.prisma.submission.update({ where: { id }, data: data as any }) as any;
  }

  async upsertAnswer(submissionId: string, questionId: string, selectedOptionId: string): Promise<any> {
    return this.prisma.submissionAnswer.upsert({
      where: { submissionId_questionId: { submissionId, questionId } },
      update: { selectedOptionId, answeredAt: new Date() },
      create: { submissionId, questionId, selectedOptionId, answeredAt: new Date() },
    });
  }

  async unlinkRespondent(respondentId: string): Promise<void> {
    await this.prisma.submission.updateMany({
      where: { respondentId },
      data: { respondentId: null },
    });
  }
}
