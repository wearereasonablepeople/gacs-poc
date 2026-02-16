import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  /** Start a new draft submission (public, no auth required) */
  async startSubmission(questionnaireId: string) {
    const q = await this.prisma.questionnaire.findUnique({ where: { id: questionnaireId } });
    if (!q || !q.isPublished) throw new BadRequestException('Questionnaire not found or not published');

    return this.prisma.submission.create({
      data: { questionnaireId, startedAt: new Date() },
    });
  }

  /** Save or update an answer (auto-save, public) */
  async saveAnswer(submissionId: string, questionId: string, selectedOptionId: string) {
    // Verify the option belongs to the question
    const option = await this.prisma.questionOption.findUnique({
      where: { id: selectedOptionId },
    });
    if (!option || option.questionId !== questionId) {
      throw new BadRequestException('Selected option does not belong to this question');
    }

    return this.prisma.submissionAnswer.upsert({
      where: { submissionId_questionId: { submissionId, questionId } },
      update: { selectedOptionId, answeredAt: new Date() },
      create: { submissionId, questionId, selectedOptionId, answeredAt: new Date() },
    });
  }

  /** Get a submission with all answers */
  async findOne(id: string) {
    const submission = await this.prisma.submission.findUnique({
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
            id: true,
            title: true,
            slug: true,
            sections: { select: { _count: { select: { questions: true } } } },
          },
        },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    const totalQuestions = submission.questionnaire.sections.reduce((sum, sec) => sum + sec._count.questions, 0);
    const { sections: _sections, ...questionnaire } = submission.questionnaire;
    return { ...submission, questionnaire, totalQuestions };
  }

  /** List submissions for a questionnaire (admin view) */
  async findByQuestionnaire(questionnaireId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { questionnaireId },
      orderBy: { createdAt: 'desc' },
      include: {
        respondent: { select: { email: true, isEmailVerified: true } },
        questionnaire: {
          select: {
            sections: { select: { _count: { select: { questions: true } } } },
          },
        },
        _count: { select: { answers: true } },
      },
    });

    return submissions.map((s) => {
      const totalQuestions = s.questionnaire.sections.reduce((sum, sec) => sum + sec._count.questions, 0);
      const { questionnaire: _q, ...rest } = s;
      return { ...rest, totalQuestions };
    });
  }

  /** List submissions for a tenant (admin view) */
  async findByTenant(tenantId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { questionnaire: { tenantId } },
      orderBy: { createdAt: 'desc' },
      include: {
        questionnaire: {
          select: {
            title: true,
            slug: true,
            sections: { select: { _count: { select: { questions: true } } } },
          },
        },
        respondent: { select: { email: true, isEmailVerified: true } },
        _count: { select: { answers: true } },
      },
    });

    return submissions.map((s) => {
      const totalQuestions = s.questionnaire.sections.reduce((sum, sec) => sum + sec._count.questions, 0);
      const { sections: _sections, ...questionnaire } = s.questionnaire;
      return { ...s, questionnaire, totalQuestions };
    });
  }

  /** Get full data needed for PDF generation (public, by submission ID) */
  async getPdfData(id: string) {
    const submission = await this.prisma.submission.findUnique({
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
            tenant: { select: { name: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true, headerTextColor: true, subtextColor: true, faviconUrl: true } },
            sections: {
              orderBy: { displayOrder: 'asc' },
              include: {
                questions: {
                  orderBy: { displayOrder: 'asc' },
                  include: {
                    options: { orderBy: { displayOrder: 'asc' } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    // Build a lookup of answers by question ID
    const answerMap = new Map(
      submission.answers.map((a) => [a.question.id, a.selectedOption]),
    );

    return {
      id: submission.id,
      submittedAt: submission.submittedAt,
      respondentEmail: submission.respondent?.email ?? null,
      questionnaire: {
        title: submission.questionnaire.title,
        tenant: submission.questionnaire.tenant,
        sections: submission.questionnaire.sections.map((section) => ({
          code: section.code,
          title: section.title,
          questions: section.questions.map((q) => ({
            code: q.code,
            prompt: q.prompt,
            selectedOption: answerMap.get(q.id)
              ? { label: answerMap.get(q.id)!.label, groupLabel: answerMap.get(q.id)!.groupLabel }
              : null,
          })),
        })),
      },
    };
  }

  /** Export submission data for a tenant (CSV-friendly format) */
  async exportByTenant(tenantId: string) {
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
}
